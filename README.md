# EchoChamber for SillyTavern

**EchoChamber** (formerly DiscordChat) is a powerful SillyTavern extension that generates a dynamic, AI-powered "audience" feed reacting live to your story. Whether it's a salt-fueled Twitch chat, a viral Twitter thread, or a voyeuristic NSFW advisor, EchoChamber brings your world to life with highly customizable reactions.

![EchoChamber Preview](https://github.com/SillyTavern/Extension-DiscordChat/raw/main/preview.png) *(Placeholder for your actual preview image)*

## 🚀 Features

- **Dynamic Chat Styles**: Choose from 10+ built-in personas or create your own.
- **Multiple AI Backends**: High-performance support for **Ollama** and **OpenAI Compatible APIs** (KoboldCPP, LM Studio, vLLM, etc.).
- **Quick Settings Bar**: Adjust user count and switch styles on the fly directly below the chat.
- **Style Manager**: Import new styles, rename existing ones, or delete those you don't use via the settings panel.
- **Discord-Lite Markdown**: Support for **bold**, *italics*, <u>underline</u>, ~~strikethrough~~, and `code` blocks within the feed.
- **Theme Aware**: Automatically inherits your SillyTavern theme colors for emphasis (italics) and text, ensuring it always looks native.
- **Multi-Paragraph Support**: Specific styles (like Ava and Kai) can generate long-form, multi-paragraph responses while staying in a single chat bubble.

## 🎭 Built-in Styles

| Style | Description |
|-------|-------------|
| **Discord / Twitch** | High-energy, slang-heavy live chat reactions. |
| **Lovable Idiots** | (Dumb & Dumber) Hilariously wrong interpretations from a group of idiots. |
| **Doomscrollers** | Existential dread and gallows humor from the void. |
| **Ava / Kai NSFW** | Erotic advisors (Female/Male) providing explicit, provocative commentary. |
| **MST3K** | Sarcastic, roasting-heavy commentary. |
| **Breaking News** | Dramatic ticker-style headlines reacting to plot twists. |
| **Twitter / X** | Social media threads with hashtags and viral energy. |
| **Thoughtful/Verbose** | Deep literary analysis and character study. |
| **HypeBot** | A single, focused hyper-enthusiastic reaction. |

## 🛠 Installation

1. Clone or download this repository into your SillyTavern extensions folder:
   `SillyTavern/data/default-user/extensions/third-party/Extension-EchoChamber`
2. Restart SillyTavern.
3. Open **Extensions** (puzzle icon) -> **EchoChamber** to enable and configure.

## ⚙️ Configuration

### Generation Engines
EchoChamber supports two main local providers:
- **Ollama**: Automatically detects running models on your local instance.
- **OpenAI Compatible**: Easily connect to **KoboldCPP**, **LM Studio**, or any v1-compatible endpoint. Includes convenient presets for common tools.

### Customization
Every style is powered by a Markdown file in the `/chat-styles/` folder. You can:
- **Edit existing prompts**: Tweak the instructions to change the "vibe" of any style.
- **Import New Styles**: Use the "Import" button in the settings panel to quickly add `.md` prompt templates.
- **Quick Bar**: Toggle the "Show Quick Settings Bar" to manage EchoChamber without leaving the main chat view.

## 📝 Custom Style Guide
EchoChamber parses responses based on a simple `Username: Message` format. When writing a custom style:
1. Ensure your prompt tells the AI to output in the `Name: Content` format.
2. For single-message styles (like advisors), the extension will automatically group multi-paragraph responses into one bubble if the AI follows your paragraph rules.

## 🔒 Requirements
- SillyTavern 1.12.0 or higher.
- A local LLM backend (Ollama, KoboldCPP, etc.).

---
**Created by Antigravity**  
*Enhance your roleplay with a living, breathing audience.*
