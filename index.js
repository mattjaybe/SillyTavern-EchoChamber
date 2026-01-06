import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, getContext, renderExtensionTemplateAsync } from '../../../extensions.js';
import { debounce } from '../../../utils.js';
import { getPresetManager } from '../../../../scripts/preset-manager.js';

const urlParts = import.meta.url.split('/');
const extensionsIndex = urlParts.lastIndexOf('extensions');
const MODULE_NAME = urlParts.slice(extensionsIndex + 1, -1).join('/');
const BASE_URL = urlParts.slice(0, -1).join('/');

const settings = {
    enabled: true,
    showQuickBar: true,
    source: 'default',
    preset: '', // Connection Profile preset name
    url: 'http://localhost:11434', // Ollama URL
    model: '', // Selected Ollama model
    openai_url: 'http://localhost:1234/v1',
    openai_model: 'local-model',
    openai_preset: 'custom',
    userCount: 5,
    fontSize: 15, // Font size in pixels
    chatHeight: 250, // Chat area height in pixels
    style: 'twitch',
    custom_styles: {}, // { id: { name: "Name", prompt: "Content" } }
    deleted_styles: [] // List of IDs
};

let discordBar;
let discordContent;
let discordQuickBar;
let abortController;

const generateDebounced = debounce(() => generateDiscordChat(), 500);
const checkStatusDebounced = debounce(() => checkOllamaStatus(), 1000);

/**
 * Sets the Discord Chat HTML content. Preserves scroll position of the chat.
 * @param {string} html HTML content to set
 */
function setDiscordText(html) {
    const chatBlock = $('#chat');
    // Check if valid element
    if (chatBlock.length === 0) return;

    const originalScrollBottom = chatBlock[0].scrollHeight - (chatBlock.scrollTop() + chatBlock.outerHeight());

    if (discordContent && discordContent.length > 0) {
        discordContent.html(html);
        console.log('[EchoChamber] Updated discordContent HTML');
    } else if (discordBar && discordBar.length > 0) {
        // Fallback if not initialized yet
        discordBar.html(html);
        console.log('[EchoChamber] Updated discordBar HTML (fallback)');
    } else {
        console.error('[EchoChamber] Failed to set text: no target elements found', { contentExist: !!discordContent, barExist: !!discordBar });
    }

    const newScrollTop = chatBlock[0].scrollHeight - (chatBlock.outerHeight() + originalScrollBottom);
    chatBlock.scrollTop(newScrollTop);
}

function applyFontSize(size) {
    let styleEl = $('#discord_font_size_style');
    if (styleEl.length === 0) {
        styleEl = $('<style id="discord_font_size_style"></style>').appendTo('head');
    }
    styleEl.text(`
        .discord_container { font-size: ${size}px !important; }
        .discord_username { font-size: ${size / 15}rem !important; }
        .discord_content { font-size: ${(size / 15) * 0.95}rem !important; }
        .discord_timestamp { font-size: ${(size / 15) * 0.75}rem !important; }
    `);
}

/**
 * Formats a single Discord message line into HTML
 * @param {string} username
 * @param {string} content
 * @returns {string} HTML string
 */
function formatMessage(username, content) {
    // Generate a consistent pseudo-random color for the username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${Math.abs(hash) % 360}, 75%, 70%)`; // Lighter/Brighter for better contrast on dark

    // Fake timestamp
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simple Discord-lite Markdown Rendering
    const formattedContent = content
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/`(.+?)`/g, '<code>$1</code>');

    return `
    <div class="discord_message">
        <div class="discord_avatar" style="background-color: ${color};">${username.substring(0, 1).toUpperCase()}</div>
        <div class="discord_body">
            <div class="discord_header">
                <span class="discord_username" style="color: ${color};">${username}</span>
                <span class="discord_timestamp">${time}</span>
            </div>
            <div class="discord_content">${formattedContent}</div>
        </div>
    </div>`;
}

/**
 * Called when a chat event occurs.
 * @param {boolean} clear Clear the bar.
 */
function onChatEvent(clear) {
    if (clear) {
        setDiscordText('');
    }

    if (abortController) {
        abortController.abort();
    }

    generateDebounced();
}

/**
 * Checks Ollama connection, populates dropdown, and updates status.
 */
async function checkOllamaStatus() {
    const statusDiv = $('#discord_ollama_status');
    const modelSelect = $('#discord_model_select');

    if (settings.source !== 'ollama') {
        statusDiv.empty();
        return;
    }

    statusDiv.text('Checking connection...');
    statusDiv.removeClass('discord_ollama_connected discord_ollama_disconnected');

    const baseUrl = settings.url.replace(/\/$/, '');

    try {
        // 1. Fetch available models (tags)
        const tagsRes = await fetch(`${baseUrl}/api/tags`);
        if (!tagsRes.ok) throw new Error(tagsRes.statusText);
        const tagsData = await tagsRes.json();
        const availableModels = tagsData.models || [];

        // 2. Fetch running models (ps)
        let runningModelName = null;
        try {
            const psRes = await fetch(`${baseUrl}/api/ps`);
            if (psRes.ok) {
                const psData = await psRes.json();
                if (psData.models && psData.models.length > 0) {
                    runningModelName = psData.models[0].name;
                }
            }
        } catch (e) { console.warn('PS fetch failed', e); }

        // Populate Dropdown
        modelSelect.empty();
        if (availableModels.length === 0) {
            modelSelect.append(new Option('No models found', ''));
            statusDiv.text('Connected, but no models found.');
            statusDiv.addClass('discord_ollama_disconnected');
            return;
        }

        availableModels.forEach(m => {
            modelSelect.append(new Option(m.name, m.name));
        });

        // Determine selection
        // Priority: Running Model > Previously Saved Setting > First Available
        let targetModel = settings.model;

        // If we found a running model, we prioritize it significantly,
        // especially if the user hasn't explicitly chosen one yet or if we want to "default" to it.
        // The user request was "default to the one that's already loaded".
        if (runningModelName) {
            targetModel = runningModelName;
        } else if (!targetModel || !availableModels.some(m => m.name === targetModel)) {
            // If saved model is invalid or empty, use first available
            targetModel = availableModels[0].name;
        }

        // Set value
        modelSelect.val(targetModel);
        settings.model = targetModel; // Update settings
        Object.assign(extension_settings.discord_chat, settings);
        saveSettingsDebounced();

        statusDiv.html(`&#10004; Connected! Found <b>${availableModels.length}</b> models.`);
        statusDiv.addClass('discord_ollama_connected');

    } catch (err) {
        console.warn('Ollama status check failed', err);
        statusDiv.text(`Connection Failed: ${err.message}. Ensure Ollama is running.`);
        statusDiv.addClass('discord_ollama_disconnected');
        modelSelect.empty();
        modelSelect.append(new Option('Connection Failed', ''));
    }
}


/**
 * Generates the Discord chat.
 */
async function generateDiscordChat() {
    if (!settings.enabled) {
        discordBar.hide();
        return;
    }
    discordBar.show();

    const context = getContext();
    // Only generate if the last message is from the AI
    const chat = context.chat;
    if (!chat || chat.length === 0) return;

    const lastMessage = chat[chat.length - 1];
    console.log(`[EchoChamber] Last message by: ${lastMessage.name}, is_user: ${lastMessage.is_user}`);

    if (lastMessage.is_user) {
        setDiscordText(`
            <div class="discord_status_container">
                <div class="discord_status_msg"><i class="fa-solid fa-keyboard"></i> Target is typing...</div>
            </div>
        `);
        return;
    }

    // Improved Processing UI
    setDiscordText(`
        <div class="discord_status_container">
            <div class="discord_status_msg">
                <i class="fa-solid fa-circle-notch fa-spin"></i> EchoChamber is processing...
            </div>
            <button id="discord_stop_btn">
                <i class="fa-solid fa-stop"></i> Cancel Generation
            </button>
        </div>
    `);

    // Bind stop button
    $(document).off('click', '#discord_stop_btn').on('click', '#discord_stop_btn', () => {
        if (abortController) {
            console.log('[EchoChamber] User requested stop');
            $('#discord_stop_btn').html('<i class="fa-solid fa-hourglass"></i> Stopping...').prop('disabled', true);
            abortController.abort();
            setTimeout(() => setDiscordText('<div class="discord_status">Generation stopped by user.</div>'), 200);
        }
    });

    abortController = new AbortController();
    console.log('[EchoChamber] AbortController initialized. Starting generation logic...');

    // Prepare prompt
    // Get last few messages for context
    const cleanMessage = (text) => {
        if (!text) return '';
        // Strip common reasoning/thinking tags used by models like Claude and DeepSeek
        return text.replace(/<(thought|think|reasoning)>[\s\S]*?<\/\1>/gi, '').trim();
    };

    const history = chat.slice(-3).map(msg => `${msg.name}: ${cleanMessage(msg.mes)}`).join('\n');

    // Override userCount for specific styles
    let targetUserCount = parseInt(settings.userCount) || 5;
    if (settings.style === 'nsfw_ava' || settings.style === 'nsfw_kai') targetUserCount = 1;
    if (settings.style === 'hypebot') targetUserCount = 1;

    const userCount = Math.max(1, Math.min(20, targetUserCount));
    console.log(`[EchoChamber] Generating Chat. Style: ${settings.style}, UserCount: ${userCount}`);

    // Get system prompt from markdown file
    const { sys } = await getPromptForStyle(settings.style || 'twitch', userCount);

    const systemPrompt = sys;
    // console.log(`[DiscordChat] Using style: ${settings.style}. System Prompt Length: ${systemPrompt.length}`);

    // prompt construction with System Prompt at the END to maximize adherence
    const taskMsg = userCount > 1
        ? `Generate ${userCount} distinct entries reacting to the context above.`
        : `Generate your response reacting to the context above. Use multiple paragraphs if instructed by your persona.`;

    const truePrompt = `[STORY CONTEXT]
${history}

[INSTRUCTION]
${sys}

[TASK]
${taskMsg}
STRICTLY follow the format defined in the instruction.
Do NOT continue the story or roleplay as the characters.
Do NOT output "Here are the messages". Just the content.`;

    try {
        let result = '';
        console.log(`[EchoChamber] Generation Source: ${settings.source}`);

        if (settings.source === 'ollama') {
            const baseUrl = settings.url.replace(/\/$/, '');
            let modelToUse = settings.model;

            if (!modelToUse) {
                setDiscordText('<div class="discord_status">No Ollama model selected. Check settings.</div>');
                // Try to recover if settings are stale by triggering a check
                checkOllamaStatus();
                return;
            }

            // Generate
            console.log(`[DiscordChat] Generating with model: ${modelToUse} at ${baseUrl} `);

            // Create a timeout for the generation request
            const timeoutId = setTimeout(() => abortController && abortController.abort(), 45000);

            try {
                const response = await fetch(`${baseUrl}/api/generate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: modelToUse,
                        system: systemPrompt,
                        prompt: truePrompt, // Use the prompt ending in <discordchat>
                        stream: false,
                        options: {
                            num_ctx: 2048,
                            num_predict: 512,
                            stop: ["</discordchat>"]
                        }
                    }),
                    signal: abortController.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Ollama API Error(${response.status}): ${errText} `);
                }
                const data = await response.json();
                result = data.response;

                // Since we injected <discordchat> at the end of prompt, the model likely just continues.
                // It might NOT output the opening tag, or it might output the rest of the lines.
                // We prepended it in prompt, effectively.
                console.log('[DiscordChat] Raw Output:', result);

            } catch (fetchErr) {
                clearTimeout(timeoutId);
                if (fetchErr.name === 'AbortError') {
                    throw new Error('Ollama Request Timed Out (30s). Model might be unloading or too slow.');
                }
                throw fetchErr;
            }
        } else if (settings.source === 'openai') {
            const baseUrl = settings.openai_url.replace(/\/$/, '');
            const targetEndpoint = `${baseUrl}/chat/completions`;

            // Detect if this is a localhost/local network URL
            const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\[::1\])(:|\/|$)/i.test(baseUrl);

            let response;

            if (isLocalhost) {
                // Direct connection for localhost (KoboldCPP, LM Studio, etc.)
                console.log(`[EchoChamber] Generating with local API: ${settings.openai_model} at ${targetEndpoint}`);
                response = await fetch(targetEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: settings.openai_model || 'local-model',
                        messages: [
                            { role: 'user', content: truePrompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                        stream: false
                    }),
                    signal: abortController.signal
                });
            } else {
                // Use CORS proxy for external APIs
                console.log(`[EchoChamber] Generating via CORS proxy: ${settings.openai_model} -> ${targetEndpoint}`);
                response = await fetch('/api/proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Target-URL': targetEndpoint
                    },
                    body: JSON.stringify({
                        model: settings.openai_model || 'local-model',
                        messages: [
                            { role: 'user', content: truePrompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                        stream: false
                    }),
                    signal: abortController.signal
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[EchoChamber] API Error:`, errorText);
                if (isLocalhost) {
                    throw new Error(`Local API Error: ${response.status} ${response.statusText}`);
                } else {
                    throw new Error(`Proxy Error: ${response.status} ${response.statusText}. Enable CORS proxy in config.yaml`);
                }
            }
            const data = await response.json();
            result = data.choices[0].message.content;

        } else if (settings.source === 'profile') {
            // Connection Profile generation using profile switching (ReMemory approach)
            if (!settings.preset) {
                setDiscordText('<div class="discord_status">No Connection Profile selected. Check settings.</div>');
                return;
            }

            console.log(`[EchoChamber] Generating with Connection Profile: ${settings.preset}`);

            // Find the profile object and get its ID
            const profileObj = extension_settings.connectionManager.profiles.find(p => p.name === settings.preset);

            if (!profileObj) {
                setDiscordText(`<div class="discord_status" style="color:#f04747">Profile not found "${settings.preset}"</div>`);
                return;
            }

            const targetProfileId = profileObj.id;
            // Capture current profile from UI dropdown (more reliable than extension_settings)
            const currentProfileId = $('#connection_profiles').val() || extension_settings.connectionManager.selectedProfile;
            let swappedProfile = false;

            try {
                // Swap to target profile if different from current
                if (currentProfileId !== targetProfileId) {
                    $('#connection_profiles').val(targetProfileId);
                    document.getElementById('connection_profiles').dispatchEvent(new Event('change'));
                    await new Promise((resolve) => {
                        getContext().eventSource.once(getContext().event_types.CONNECTION_PROFILE_LOADED, resolve);
                    });
                    swappedProfile = true;
                }

                // Use SillyTavern's /genraw slash command for generation
                const genCommand = `/genraw lock=on ${truePrompt}`;
                const genResult = await getContext().executeSlashCommandsWithOptions(genCommand, {
                    handleParserErrors: false,
                    handleExecutionErrors: false,
                    parserFlags: {},
                    abortController: abortController
                });

                result = genResult?.pipe || '';

            } finally {
                // Restore original profile if we swapped
                if (swappedProfile) {
                    const restoreId = currentProfileId || '';
                    $('#connection_profiles').val(restoreId);
                    document.getElementById('connection_profiles').dispatchEvent(new Event('change'));
                    await new Promise((resolve) => {
                        getContext().eventSource.once(getContext().event_types.CONNECTION_PROFILE_LOADED, resolve);
                    });
                }
            }
        } else {
            // Default Generation logic - use generateRaw for better control
            const { generateRaw } = getContext();
            const rawResult = await generateRaw({
                systemPrompt: systemPrompt,
                prompt: truePrompt,
                streaming: false
            });
            result = rawResult;
        }


        // Sanitize and Parse Result
        // Strip any wrapper tags if present, otherwise use raw result
        let cleanResult = result.replace(/<\/?discordchat>/gi, '').trim();

        const lines = cleanResult.split('\n');
        let htmlBuffer = '<div class="discord_container" style="padding-top: 10px;">';

        const parsedMessages = [];
        let currentMsg = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (!trimmedLine) {
                if (currentMsg && !currentMsg.content.endsWith('\n\n')) {
                    // Add double newline to create a proper visual paragraph gap
                    currentMsg.content += '\n\n';
                }
                continue;
            }

            // Ignore ellipses and noise lines
            if (/^[\.\…\-\_]+$/.test(trimmedLine)) continue;

            // Check if this line is a new message (Name: Content)
            // Regex matches "Name: Content" but avoids catching sentences with colons by limiting name length
            const match = trimmedLine.match(/^(?:[\d\.\-\*]*\s*)?([^:\n]{1,32}):\s*(.+)$/);

            if (match) {
                let name = match[1].trim().replace(/[\*_"`]/g, '');
                let content = match[2].trim();

                // Noise filter for content
                if (/^[\.\…\-\_\?\!]+$/.test(content)) continue;

                // Force specific names for single-user styles
                if (settings.style === 'hypebot') name = 'HypeBot';

                currentMsg = { name, content };
                parsedMessages.push(currentMsg);
            } else {
                // Continuation of previous message or start a fallback message
                if (currentMsg) {
                    // Replace single newline with double if it looks like a paragraph break
                    const separator = currentMsg.content.endsWith('\n\n') ? '' :
                        (currentMsg.content.endsWith('\n') ? '\n' : ' ');
                    currentMsg.content += separator + trimmedLine;
                } else {
                    // Fallback: If no message started yet, use style-specific names
                    let fallbackUser = 'Chatter';
                    if (settings.style === 'nsfw_ava') fallbackUser = 'Ava';
                    else if (settings.style === 'nsfw_kai') fallbackUser = 'Kai';
                    else if (settings.style === 'news') fallbackUser = 'NewsTicker';
                    else if (settings.style === 'verbose') fallbackUser = 'Anon';

                    currentMsg = { name: fallbackUser, content: trimmedLine };
                    parsedMessages.push(currentMsg);
                }
            }
        }

        // Render collected messages up to userCount
        let messageCount = 0;
        for (const msg of parsedMessages) {
            if (messageCount >= userCount) break;

            // Final message filters
            const cleanContent = msg.content.trim();
            if (cleanContent.length < 2) continue;

            // Filter out meta-commentary
            const lowerContent = cleanContent.toLowerCase();
            if (lowerContent.includes('here are') || lowerContent.includes('here is')) continue;
            if (lowerContent.includes('capturing the') || lowerContent.includes('reacting to')) continue;

            htmlBuffer += formatMessage(msg.name, cleanContent);
            messageCount++;
        }

        // Fallback: If 0 messages parsed, show raw output only if it's real text
        // Filter out "...", "??", etc.
        if (messageCount === 0) {
            const cleanTrim = cleanResult.trim();
            if (cleanTrim.length > 0 && !/^[\.\…\-\_\?\!]+$/.test(cleanTrim)) {
                // Use a generic name if generic text, or 'System' if it looks like an error
                let fName = 'ChatLog';
                if (settings.style === 'nsfw_ava') fName = 'Ava';
                else if (settings.style === 'nsfw_kai') fName = 'Kai';
                else if (settings.style === 'hypebot') fName = 'HypeBot';

                htmlBuffer += formatMessage(fName, cleanTrim);
                messageCount = 1;
            }
        }

        htmlBuffer += '</div>';

        if (messageCount === 0) {
            // Only show error if we truly found nothing usable
            setDiscordText('<div class="discord_status">No valid chat lines generated.</div>');
            console.warn('[DiscordChat] Empty parse. Raw:', result);
        } else {
            console.log(`[EchoChamber] Successfully rendered ${messageCount} messages`);
            setDiscordText(htmlBuffer);
        }

    } catch (err) {
        console.error('Discord Chat generation failed', err);
        setDiscordText(`<div class="discord_status" style="color: #f04747;">Error: ${err.message}</div>`);
    }
}

// --- PROMPT LOADING FROM MARKDOWN FILES ---
let promptCache = {};

/**
 * Style filename mapping
 */
const STYLE_FILES = {
    'twitch': 'discordtwitch.md',
    'verbose': 'thoughtfulverbose.md',
    'twitter': 'twitterx.md',
    'news': 'breakingnews.md',
    'mst3k': 'mst3k.md',
    'nsfw_ava': 'nsfwava.md',
    'nsfw_kai': 'nsfwkai.md',
    'hypebot': 'hypebot.md',
    'doomscrollers': 'doomscrollers.md',
    'dumbanddumber': 'dumbanddumber.md',
    'custom': 'custom.md'
};

const BUILT_IN_STYLES = [
    { val: 'twitch', label: 'Discord / Twitch', desc: '(Live Chat & Slang)' },
    { val: 'verbose', label: 'Thoughtful / Verbose', desc: '(Literary Analysis)' },
    { val: 'twitter', label: 'Twitter / X', desc: '(Social Media Thread)' },
    { val: 'news', label: 'Breaking News', desc: '(Headlines Only)' },
    { val: 'mst3k', label: 'MST3K', desc: '(Sarcastic Commentary)' },
    { val: 'nsfw_ava', label: 'Ava NSFW', desc: '(Erotic Female Avatar)' },
    { val: 'nsfw_kai', label: 'Kai NSFW', desc: '(Erotic Male Avatar)' },
    { val: 'hypebot', label: 'HypeBot', desc: '(Single Hype Reaction)' },
    { val: 'doomscrollers', label: 'Doomscrollers', desc: '(Existential Dread)' },
    { val: 'dumbanddumber', label: 'Dumb & Dumber', desc: '(Lovable Idiots)' },
    { val: 'custom', label: 'Custom', desc: '(Edit custom.md)' }
];

function getAllStyles() {
    let styles = [...BUILT_IN_STYLES];

    // Add Custom from Settings
    if (settings.custom_styles) {
        Object.keys(settings.custom_styles).forEach(id => {
            const s = settings.custom_styles[id];
            styles.push({ val: id, label: s.name, desc: '(Custom)' });
        });
    }

    // Filter Deleted
    if (settings.deleted_styles) {
        styles = styles.filter(s => !settings.deleted_styles.includes(s.val));
    }

    return styles;
}
/**
 * Loads a chat style prompt from markdown file
 */
async function loadChatStyle(style) {
    // Check for custom styles first
    if (settings.custom_styles && settings.custom_styles[style]) {
        console.log(`[EchoChamber] Loaded custom style: ${style}`);
        return settings.custom_styles[style].prompt;
    }

    // Return from cache if already loaded (for built-in styles)
    if (promptCache[style]) return promptCache[style];

    const filename = STYLE_FILES[style] || STYLE_FILES['twitch'];

    const url = `${BASE_URL}/chat-styles/${filename}?v=${new Date().getTime()}`;
    console.log(`[EchoChamber] Fetching style "${style}" from: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const content = await response.text();

        console.log(`[EchoChamber] Successfully loaded style: ${style}. Length: ${content.length}`);

        // Cache the loaded prompt
        promptCache[style] = content;
        return content;
    } catch (err) {
        console.error(`[EchoChamber] Failed to load ${filename} from ${url}:`, err);
        if (typeof toastr !== 'undefined') toastr.error(`Style load failed: ${filename}. Check console for path.`);
        // Fallback to basic prompt
        return `Generate chat messages reacting to the story. Output ONLY in format:\nusername: message`;
    }
}

async function getPromptForStyle(style, userCount) {
    const systemPrompt = await loadChatStyle(style);

    // For the user prompt, we'll construct it to be simple and direct
    return { sys: systemPrompt, example: '' };
}

/**
 * Loads settings from SillyTavern's extension storage and updates UI.
 */
function loadSettings() {
    if (!extension_settings.discord_chat) {
        extension_settings.discord_chat = {};
    }

    // Merge saved settings with defaults
    Object.assign(settings, extension_settings.discord_chat);
    settings.userCount = parseInt(settings.userCount) || 5;

    // Update UI elements
    $('#discord_enabled').prop('checked', settings.enabled);
    $('#discord_user_count').val(settings.userCount);
    $('#discord_source').val(settings.source);
    $('#discord_url').val(settings.url);
    // Style dropdown is populated by updateAllDropdowns
    // $('#discord_style').val(settings.style || 'twitch');
    $('#discord_openai_url').val(settings.openai_url);
    $('#discord_openai_model').val(settings.openai_model);
    $('#discord_openai_preset').val(settings.openai_preset || 'custom');
    $('#discord_preset_select').val(settings.preset || '');
    $('#discord_quick_bar_enabled').prop('checked', settings.showQuickBar);
    $('#discord_font_size').val(settings.fontSize || 15);

    // Apply font size
    applyFontSize(settings.fontSize || 15);

    // Apply height from settings
    if (settings.chatHeight && discordContent) {
        discordContent.css('height', `${settings.chatHeight}px`);
    }

    updateSourceVisibility();
    updateAllDropdowns();

    // Update Quick Bar if exists
    if (discordQuickBar) {
        // Style updated in updateAllDropdowns
        discordQuickBar.find('.discord_quick_count').val(settings.userCount);

        const toggleBtn = discordQuickBar.find('.discord_quick_toggle i');
        const isEnabled = settings.enabled;
        toggleBtn.toggleClass('fa-toggle-on', isEnabled).toggleClass('fa-toggle-off', !isEnabled);
        toggleBtn.css('color', isEnabled ? '#4caf50' : '#f44336');

        if (isEnabled) discordContent.show();
        else discordContent.hide();
        if (settings.showQuickBar) discordQuickBar.show();
        else discordQuickBar.hide();
    }

    // Initial Visibility
    if (settings.enabled) discordBar.show(); else discordBar.hide();

    // Check connection if Ollama is selected
    if (settings.source === 'ollama') {
        checkOllamaStatus();
    }
}

function updateSourceVisibility() {
    const source = settings.source || 'default';
    console.log(`[EchoChamber] Updating visibility for source: ${source}`);

    const ollamaDiv = $('#discord_ollama_settings');
    const openaiDiv = $('#discord_openai_settings');
    const profileDiv = $('#discord_profile_settings');

    ollamaDiv.toggle(source === 'ollama');
    openaiDiv.toggle(source === 'openai');
    profileDiv.toggle(source === 'profile');

    console.log(`[EchoChamber] Ollama visible: ${ollamaDiv.is(':visible')}, OpenAI visible: ${openaiDiv.is(':visible')}, Profile visible: ${profileDiv.is(':visible')}`);

    // Populate preset dropdown when profile is selected
    if (source === 'profile') {
        populatePresetDropdown();
    }
}

async function populatePresetDropdown() {
    const select = $('#discord_preset_select');

    select.empty();
    select.append('<option value="">-- Select a Connection Profile --</option>');

    try {
        console.log('[EchoChamber] Attempting to load connection profiles from data...');

        // Wait up to 2 seconds for profiles to be available in extension_settings
        let profilesData = [];
        for (let i = 0; i < 10; i++) {
            profilesData = extension_settings.connectionManager?.profiles || [];
            if (profilesData.length > 0) break;
            await new Promise(r => setTimeout(r, 200));
        }

        if (profilesData.length > 0) {
            console.log(`[EchoChamber] Found ${profilesData.length} profiles in connectionManager data`);
            profilesData.forEach(profile => {
                select.append(`<option value="${profile.name}">${profile.name}</option>`);
            });

            // Set current value if exists
            if (settings.preset) {
                select.val(settings.preset);
            }
        } else {
            console.warn('[EchoChamber] No profiles found in connectionManager data. Falling back to UI scraping...');
            const profileSelect = $('#api_button_chat_completion_profile');
            if (profileSelect.length > 0) {
                profileSelect.find('option').each(function () {
                    const value = $(this).val();
                    const text = $(this).text();
                    if (value && value !== '' && !text.includes('--')) {
                        select.append(`<option value="${text}">${text}</option>`);
                    }
                });
                if (settings.preset) select.val(settings.preset);
            }
        }
    } catch (error) {
        console.error('[EchoChamber] Error populating preset dropdown:', error);
    }
}

function renderStyleOptions(selectedVal) {
    return getAllStyles().map(s => `<option value="${s.val}" ${s.val === selectedVal ? 'selected' : ''}>${s.label}</option>`).join('');
}

function updateAllDropdowns() {
    const styles = getAllStyles();

    // Update Quick Bar
    if (discordQuickBar) {
        const styleDropdown = discordQuickBar.find('.discord_quick_style');
        const qVal = styleDropdown.val();
        const quickHtml = renderStyleOptions(qVal || settings.style);
        styleDropdown.empty().append(quickHtml);
    }

    // Update Settings Style Select
    const sSelect = $('#discord_style');
    const sVal = sSelect.val();
    sSelect.empty();
    styles.forEach(s => {
        sSelect.append(`<option value="${s.val}">${s.label}</option>`);
    });
    sSelect.val(sVal || settings.style);

    // Update Manager Select
    const mSelect = $('#discord_manage_style_select');
    if (mSelect.length) {
        mSelect.empty();
        styles.forEach(s => {
            mSelect.append(`<option value="${s.val}">${s.label} ${s.desc}</option>`);
        });
    }
}

jQuery(async () => {
    // Initial Data Load
    if (!extension_settings.discord_chat) extension_settings.discord_chat = {};
    Object.assign(settings, extension_settings.discord_chat);
    settings.userCount = parseInt(settings.userCount) || 5;

    // UI Setup
    const getContainer = () => $(document.getElementById('discord_settings') ?? document.getElementById('extensions_settings2'));
    const container = getContainer();

    // Only append if we haven't already
    if ($('#discord_enabled').length === 0) {
        container.append(await renderExtensionTemplateAsync(MODULE_NAME, 'settings'));
    }

    discordBar = $('<div id="discordBar"></div>');

    // Quick Settings Bar

    discordQuickBar = $(`
        <div id="discordQuickSettings" style="display:flex; justify-content:space-between; align-items:center; padding: 4px 8px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(128,128,128,0.2); font-size: 0.85em; margin-bottom: 0;">
            <div class="discord_quick_left" style="display:flex; gap: 8px; align-items:center;">
                <div class="discord_quick_toggle" style="cursor:pointer; display:flex; align-items:center; justify-content:center; width: 22px; height: 22px;" title="Enable/Disable EchoChamber">
                    <i class="fa-solid fa-toggle-on" style="font-size: 1.1em; margin-top: -2px;"></i>
                </div>
                <div style="display:flex; align-items:center; background: rgba(255,255,255,0.05); border: 1px solid rgba(128,128,128,0.2); border-radius: 4px; padding: 0 4px 0 8px; height: 22px;">
                    <select class="discord_quick_style" title="Chat Style" style="background:transparent; border:none; color:var(--SmartThemeQuoteColor); width:auto; max-width: 240px; cursor:pointer; font-weight:bold; outline:none; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 20px; font-size: 1em; line-height: 22px;">
                        ${renderStyleOptions(settings.style)}
                    </select>
                    <i class="fa-solid fa-chevron-down" style="font-size: 0.7em; margin-left: -16px; pointer-events: none; opacity: 0.7;"></i>
                </div>
            </div>
             <div class="discord_quick_right" style="display:flex; align-items:center; gap:5px;">
                  <div class="discord_quick_refresh" style="cursor:pointer; font-weight:bold; opacity:0.8; margin-right:2px; padding:2px 5px;" title="Regenerate Chat">Refresh</div>
                  <i class="fa-solid fa-users" style="color:var(--SmartThemeQuoteColor); font-size: 0.9em; opacity:0.8;" title="User Count"></i>
                  <input type="text" class="discord_quick_count" title="User Count" value="${settings.userCount}" style="width: 30px; height: 18px; background:transparent; border:1px solid rgba(128,128,128,0.5); border-radius:3px; color:inherit; text-align:center; font-size: 1.1em; padding: 0;">
                  <i class="fa-solid fa-font" style="color:var(--SmartThemeQuoteColor); font-size: 0.9em; opacity:0.8; margin-left: 3px;" title="Font Size"></i>
                  <input type="text" class="discord_quick_font" title="Font Size" value="${settings.fontSize || 15}" style="width: 30px; height: 18px; background:transparent; border:1px solid rgba(128,128,128,0.5); border-radius:3px; color:inherit; text-align:center; font-size: 1.1em; padding: 0;">
             </div>
        </div>
    `);

    discordContent = $('<div id="discordContent"></div>');
    const resizeHandle = $('<div class="discord_resize_handle" id="discordResizeHandle" title="Drag to resize chat"></div>');

    discordBar.append(discordQuickBar).append(resizeHandle).append(discordContent);
    $('#send_form').append(discordBar);

    // Resizing Logic
    let isResizing = false;
    let startY, startHeight;

    const startResize = (e) => {
        isResizing = true;
        startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        startHeight = discordContent.height();
        resizeHandle.addClass('resizing');
        $('body').css('cursor', 'ns-resize');
        e.preventDefault();
    };

    const doResize = (e) => {
        if (!isResizing) return;
        const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const delta = currentY - startY;
        const newHeight = Math.max(60, startHeight - delta);
        discordContent.css('height', `${newHeight}px`);
    };

    const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        resizeHandle.removeClass('resizing');
        $('body').css('cursor', '');

        // Save height
        const finalHeight = discordContent.height();
        settings.chatHeight = finalHeight;
        if (extension_settings.discord_chat) extension_settings.discord_chat.chatHeight = finalHeight;
        saveSettingsDebounced();
    };

    resizeHandle.on('mousedown touchstart', startResize);
    $(window).on('mousemove touchmove', doResize);
    $(window).on('mouseup touchend', stopResize);

    // Quick Bar Listeners
    discordQuickBar.find('.discord_quick_toggle').on('click', function () {
        const cb = $('#discord_enabled');
        cb.prop('checked', !cb.prop('checked')).trigger('change');
    });

    // Dynamic Dropdown Logic
    const styleSelect = discordQuickBar.find('.discord_quick_style');
    const updateOptions = (showDesc) => {
        const val = styleSelect.val();
        styleSelect.empty();
        getAllStyles().forEach(s => {
            const text = showDesc ? `${s.label} ${s.desc}` : s.label;
            styleSelect.append(`<option value="${s.val}">${text}</option>`);
        });
        styleSelect.val(val);
    };

    styleSelect.on('mousedown', () => updateOptions(true));
    styleSelect.on('change', (e) => {
        updateOptions(false);
        const newVal = styleSelect.val();
        if (newVal !== settings.style) {
            console.log(`[EchoChamber] Quick Bar Style Change: ${settings.style} -> ${newVal}`);
            // Update settings immediately before triggering events
            settings.style = newVal;
            if (extension_settings.discord_chat) extension_settings.discord_chat.style = newVal;

            $('#discord_style').val(newVal).trigger('change');

            // Explicitly trigger regeneration
            if (settings.enabled) {
                onChatEvent(false);
            }
        }
    });
    styleSelect.on('blur', () => updateOptions(false));

    discordQuickBar.find('.discord_quick_count').on('input change', function () {
        const val = parseInt($(this).val());
        if (isNaN(val)) return;

        console.log(`[EchoChamber] Quick Bar User Count Change: ${val}`);
        settings.userCount = val;
        if (extension_settings.discord_chat) {
            extension_settings.discord_chat.userCount = val;
        }

        // Update main settings panel
        $('#discord_user_count').val(val);
        saveSettingsDebounced();
    });
    discordQuickBar.find('.discord_quick_refresh').on('click', function () {
        toastr.info('Regenerating EchoChamber Chat...');
        onChatEvent(false);
    });

    // --- Style Management & UI Logic handled by top-level functions ---

    // Import
    $('#discord_import_btn').on('click', function () { $('#discord_import_file').click(); });
    $('#discord_import_file').on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            const name = file.name.replace('.md', '');
            const id = 'custom_' + Date.now();

            if (!settings.custom_styles) settings.custom_styles = {};
            settings.custom_styles[id] = { name: name, prompt: content };
            extension_settings.discord_chat.custom_styles = settings.custom_styles;
            saveSettingsDebounced();

            toastr.success(`Imported style: ${name}`);
            updateAllDropdowns();
            $('#discord_style').val(id).trigger('change');
        };
        reader.readAsText(file);
        $(this).val('');
    });

    // Rename
    $('#discord_rename_btn').on('click', function () {
        const id = $('#discord_manage_style_select').val();
        if (!id) return;

        const newName = $('#discord_rename_input').val();
        if (!newName) { toastr.warning('Enter a new name'); return; }

        if (settings.custom_styles && settings.custom_styles[id]) {
            settings.custom_styles[id].name = newName;
            extension_settings.discord_chat.custom_styles = settings.custom_styles;
            saveSettingsDebounced();
            updateAllDropdowns();
            toastr.success('Renamed style');
        } else {
            toastr.warning('Cannot rename built-in styles directly. Import as new style.');
        }
    });



    // Refresh
    $('#discord_refresh_btn').on('click', function () {
        updateAllDropdowns();
        toastr.info('Refreshed style list');
    });

    // Delete
    $('#discord_delete_btn').on('click', function () {
        const id = $('#discord_manage_style_select').val();
        if (!id) return;

        if (!confirm(`Delete style? This cannot be undone.`)) return;

        // If custom
        if (settings.custom_styles && settings.custom_styles[id]) {
            delete settings.custom_styles[id];
            extension_settings.discord_chat.custom_styles = settings.custom_styles;
        } else {
            // Built-in
            if (!settings.deleted_styles) settings.deleted_styles = [];
            settings.deleted_styles.push(id);
            extension_settings.discord_chat.deleted_styles = settings.deleted_styles;
        }

        saveSettingsDebounced();
        updateAllDropdowns();

        if (settings.style === id) {
            settings.style = 'twitch';
            $('#discord_style').val('twitch').trigger('change');
        }
        toastr.info('Style deleted');
    });

    // Quick Bar Checkbox
    $('#discord_quick_bar_enabled').on('change', function () {
        settings.showQuickBar = $(this).is(':checked');
        extension_settings.discord_chat.showQuickBar = settings.showQuickBar;
        saveSettingsDebounced();

        if (settings.showQuickBar) discordQuickBar.show();
        else discordQuickBar.hide();
    });

    // Load Settings & Bind Events
    loadSettings();

    // Event Listeners for Settings
    $('#discord_enabled').on('change', function () {
        settings.enabled = $(this).is(':checked');
        extension_settings.discord_chat.enabled = settings.enabled;
        saveSettingsDebounced();

        // Update Quick Bar
        const toggleBtn = discordQuickBar.find('.discord_quick_toggle i');
        const isEnabled = settings.enabled;
        toggleBtn.toggleClass('fa-toggle-on', isEnabled).toggleClass('fa-toggle-off', !isEnabled);
        toggleBtn.css('color', isEnabled ? '#4caf50' : '#f44336');

        if (isEnabled) discordContent.show();
        else discordContent.hide();

        // Always show bar if quick bar present, to allow re-enabling
        discordBar.show();
    });

    $('#discord_user_count').on('input', function () {
        let val = parseInt($(this).val());
        if (val < 1) val = 1;
        if (val > 20) val = 20;
        settings.userCount = val;
        extension_settings.discord_chat.userCount = val;
        saveSettingsDebounced();
        // Sync Quick Bar
        discordQuickBar.find('.discord_quick_count').val(val);
    });

    $('#discord_font_size').on('input', function () {
        let val = parseInt($(this).val());
        if (val < 8) val = 8;
        if (val > 32) val = 32;
        settings.fontSize = val;
        extension_settings.discord_chat.fontSize = val;
        saveSettingsDebounced();
        applyFontSize(val);
        // Sync Quick Bar
        if (discordQuickBar) discordQuickBar.find('.discord_quick_font').val(val);
    });

    discordQuickBar.find('.discord_quick_count').on('input change', function () {
        let val = parseInt($(this).val());
        if (isNaN(val)) return;
        if (val < 1) val = 1;
        if (val > 20) val = 20;
        settings.userCount = val;
        extension_settings.discord_chat.userCount = val;
        saveSettingsDebounced();
        // Sync main panel
        $('#discord_user_count').val(val);
    });

    discordQuickBar.find('.discord_quick_font').on('input change', function () {
        let val = parseInt($(this).val());
        if (isNaN(val)) return;
        if (val < 8) val = 8;
        if (val > 32) val = 32;
        settings.fontSize = val;
        extension_settings.discord_chat.fontSize = val;
        saveSettingsDebounced();
        applyFontSize(val);
        // Sync main panel
        $('#discord_font_size').val(val);
    });

    $('#discord_source').on('change', function () {
        settings.source = $(this).val();
        extension_settings.discord_chat.source = settings.source;
        saveSettingsDebounced();
        updateSourceVisibility();
        if (settings.source === 'ollama') checkOllamaStatus();
    });

    $('#discord_style').on('change', function () {
        settings.style = $(this).val();
        extension_settings.discord_chat.style = settings.style;
        saveSettingsDebounced();
        // Sync Quick Bar
        if (discordQuickBar) discordQuickBar.find('.discord_quick_style').val(settings.style);

        // Auto-regenerate on style change
        if (settings.enabled) {
            toastr.info(`Switched to ${settings.style} style. Regenerating...`);
            generateDebounced();
        }
    });

    $('#discord_url').on('change', function () {
        settings.url = $(this).val();
        extension_settings.discord_chat.url = settings.url;
        saveSettingsDebounced();
        checkOllamaStatus();
    });

    $('#discord_model_select').on('change', function () {
        settings.model = $(this).val();
        extension_settings.discord_chat.model = settings.model;
        saveSettingsDebounced();
    });

    $('#discord_openai_url').on('change', function () {
        settings.openai_url = $(this).val();
        extension_settings.discord_chat.openai_url = settings.openai_url;
        saveSettingsDebounced();
    });

    $('#discord_openai_model').on('change', function () {
        settings.openai_model = $(this).val();
        extension_settings.discord_chat.openai_model = settings.openai_model;
        saveSettingsDebounced();
    });

    $('#discord_openai_preset').on('change', function () {
        const val = $(this).val();
        settings.openai_preset = val;
        extension_settings.discord_chat.openai_preset = val;
        saveSettingsDebounced();

        let url = '';
        let model = '';

        switch (val) {
            case 'lmstudio':
                url = 'http://localhost:1234/v1';
                model = 'local-model';
                break;
            case 'kobold':
                url = 'http://localhost:5001/v1';
                model = 'koboldcpp/model';
                break;
            case 'textgen':
                url = 'http://localhost:5000/v1';
                model = 'model';
                break;
            case 'vllm':
                url = 'http://localhost:8000/v1';
                model = 'model';
                break;
            default:
                return;
        }

        $('#discord_openai_url').val(url).trigger('change');
        $('#discord_openai_model').val(model).trigger('change');
    });

    $('#discord_preset_select').on('change', function () {
        settings.preset = $(this).val();
        extension_settings.discord_chat.preset = settings.preset;
        saveSettingsDebounced();
        console.log(`[EchoChamber] Connection Profile selected: ${settings.preset}`);
    });


    // Chat Events
    eventSource.on(event_types.chat_changed, () => {
        // Do nothing on load to prevent stale generation
    });

    eventSource.on(event_types.MESSAGE_RECEIVED, () => onChatEvent(false));

    eventSource.on(event_types.MESSAGE_SENT, () => {
        setDiscordText('<div class="discord_status">Target is typing...</div>');
    });
});
