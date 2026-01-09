
// Don't import - use global SillyTavern object instead
// import { getContext } from '../../../extensions.js';

const extensionName = "Extension-DiscordChat";

function debugLog(...args) {
    console.log(`[${extensionName}]`, ...args);
}

function debugWarn(...args) {
    console.warn(`[${extensionName}]`, ...args);
}

/**
 * Wait for the connection manager to be available
 */
async function waitForConnectionManager(maxAttempts = 10, delayMs = 200) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const context = SillyTavern.getContext();
        if (context?.extensionSettings?.connectionManager) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    debugWarn(`Connection manager not available after ${maxAttempts} attempts`);
    return false;
}

/**
 * Get profile object by name
 */
export async function getProfileByName(profileName) {
    try {
        const isAvailable = await waitForConnectionManager();
        if (!isAvailable) return null;

        const context = SillyTavern.getContext();
        const { profiles } = context.extensionSettings.connectionManager;
        return profiles.find(p => p.name === profileName) || null;
    } catch {
        return null;
    }
}

/**
 * Generate using a connection profile WITHOUT changing global settings
 * This uses the profile's settings to make a direct API call via ConnectionManagerRequestService
 */
export async function generateWithProfile(profileName, prompt, systemPrompt = '', abortController = null) {
    try {
        const profile = await getProfileByName(profileName);
        if (!profile) {
            throw new Error(`Connection profile not found: ${profileName}`);
        }

        debugLog(`Generating with profile: ${profileName} (isolated, no global state change)`);

        const context = SillyTavern.getContext();

        // Build the messages array
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        // Use the static sendRequest method with profile ID
        const response = await context.ConnectionManagerRequestService.sendRequest(
            profile.id,  // profileId
            messages,    // prompt (messages array)  
            500,         // maxTokens
            {
                stream: false,
                signal: abortController?.signal || null,
                extractData: true,
                includePreset: true,
                includeInstruct: true
            }
        );

        // The response should have the generated text
        // When extractData: true, the response is { content: "...", reasoning: "..." }

        // Debug: log the full response to see what we're getting
        console.log('[Extension-DiscordChat] Full response object:', JSON.stringify(response, null, 2));
        console.log('[Extension-DiscordChat] Response keys:', Object.keys(response || {}));
        console.log('[Extension-DiscordChat] response.content exists?', !!response?.content);

        if (response?.content) {
            debugLog('Returning response.content');
            return response.content;
        } else if (typeof response === 'string') {
            debugLog('Returning response as string');
            return response;
        } else if (response?.choices?.[0]?.message?.content) {
            debugLog('Returning response.choices[0].message.content');
            return response.choices[0].message.content;
        } else if (response?.text) {
            debugLog('Returning response.text');
            return response.text;
        } else {
            debugWarn('Unexpected response format:', response);
            throw new Error('Invalid response format from API');
        }

    } catch (error) {
        debugWarn('Error generating with profile:', error);
        throw error;
    }
}
