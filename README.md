# 🗣️ EchoChamber for SillyTavern

> **Bring your stories and conversations to life with a dynamic, AI-powered audience.**

![Version](https://img.shields.io/badge/SillyTavern-v1.12%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**EchoChamber** is a powerful extension for [SillyTavern](https://github.com/SillyTavern/SillyTavern) that generates a live reaction feed alongside your story. Whether it's a salt-fueled Discord chat, a viral Twitter feed, or a sarcastic roasting session, EchoChamber immerses you in the world.

<p align="center">
  <a href="https://github.com/user-attachments/assets/c543a4f1-0bc3-4da8-b1fa-611ab7599308">
    <img src="https://github.com/user-attachments/assets/c543a4f1-0bc3-4da8-b1fa-611ab7599308" alt="EchoChamber Hero" width="100%" style="max-width: 900px;">
  </a>
  <br>
  <sub><em>Click to view full-size screenshot</em></sub>
</p>

---

## ✨ Feature Highlights

* **Dynamic Chat Styles:** 10+ built-in styles including Discord/Twitch Chat, Twitter/X, MST3K, Breaking News, NSFW avatars, and more.
* **Flexible Backend:** Works with **Cloud/Chat Completion APIs** or **Local Models** (Ollama, KoboldCPP, LM Studio, vLLM).
* **Quick Controls:** Adjust user count and switch styles instantly with the Quick Settings bar under the chat.
* **Theme Aware:** Inherits your SillyTavern colors for a native look.
* **Full Markdown:** Supports **bold**, *italics*, <u>underline</u>, and `code` in the feed.

---

## 📸 Style Showcase

Don't just read about it—see how EchoChamber reacts to your plots. Click on the screenshot for full view/clarity.

### Social Media & Live Chat
<table>
  <tr>
    <td width="50%" align="center"><b>🎮 Discord / Twitch</b><br><i>High-energy slang and hype</i></td>
    <td width="50%" align="center"><b>🐦 Twitter / X</b><br><i>Viral threads and hashtags</i></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/38c76d6b-496e-4dbb-bdf4-ff3bf09d298b" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/8daf9133-2a01-4fb0-b447-71fc49152f31" width="100%"/></td>
  </tr>
</table>

### Dramatic & Commentary
<table>
  <tr>
    <td width="50%" align="center"><b>📢 Breaking News</b><br><i>Dramatic ticker headlines</i></td>
    <td width="50%" align="center"><b>🍿 Mystery Science Theater 3000</b><br><i>Sarcastic roasting and dry wit</i></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/afba8386-94de-42c6-aac1-399e4380b0c0" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/2ca6a0fe-94e4-4400-9fe0-e147c3c90101" width="100%"/></td>
  </tr>
</table>

<details>
<summary><strong>👀 Click here to see 5+ more styles (Dumb & Dumber, Thoughtful, etc.)</strong></summary>
<br>
<table>
  <tr>
    <td align="center"><b>🧠 Thoughtful Analysis</b><br><i>Serious and literate analysis</i></td>
    <td align="center"><b>🤪 Dumb & Dumber</b><br><i>Hilariously wrong interpretations</i></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/a21ed4b8-1aa2-4cff-8a09-6eaf11f2ca78" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/dd368bda-2e9f-4672-8541-14998a40f4de" width="100%"/></td>
  </tr>
   <tr>
    <td align="center"><b>💀 Doomscrollers</b><br><i>Existential dread and gallows humor</i></td>
    <td align="center"><b>🤖 HypeBot</b><br><i>Focused, hyper-enthusiastic reactions</i></td>
  </tr>
   <tr>
    <td><img src="https://github.com/user-attachments/assets/506889a0-7f6e-4685-9248-9a8cf157b042" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/60531ed4-5572-4c1d-99d4-783e8d493365" width="100%"/></td>
  </tr>
</table>
</details>

<details>
<summary><strong>🔞 NSFW / Erotic Styles (Click to Expand)</strong></summary>
<br>
<blockquote>
  <b>Note:</b> Includes explicit and provocative advisors Ava (Female) and Kai (Male).
</blockquote>
<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/234fca86-bbfe-49d2-8a98-d1e6bba972d8" alt="ava-nsfw" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/13afd5f9-8708-4a6b-89dc-9753bd3be451" alt="kai-nsfw" width="100%"/></td>
  </tr>
</table>
</details>

---

## 🛠 Installation

1.  Open SillyTavern and click the **Extensions** button (Puzzle piece icon).
2.  Select **Install Extension**.
3.  Copy and paste or type this URL into the box:
    ```bash
    https://github.com/mattjaybe/SillyTavern-EchoChamber
    ```
4.  Click **Install**.

---

## ⚙️ Configuration

### 1. Engine Setup
EchoChamber can either use your Chat Compeletion API that you're connected to, or run separately from your main chat model.
* **Ollama:** Automatically detects models running locally.
* **OpenAI Compatible:** Connects to **KoboldCPP**, **LM Studio**, **vLLM**, etc.
    * *Tip:* Use **Instruct** or **Thinking** models. **Instruct** models are better for EchoChamber.

### 2. Customization
* **Quick Bar:** A toggle bar appears below your chat to quickly swap styles, toggle EchoChamber on/off, refresh the chat, and adjust user counts.
* **Chat Style Manager:** Create your own styles by editing the Markdown files in the `/chat-styles/` folder.
    * **Import:** Easily share or import `.md` style files.
    * **Edit:** You can tweak prompts to change the "vibe" (e.g., make the Twitter crowd meaner, or make Ava less explicit).

### 3. Creating Custom Styles
EchoChamber parses responses based on a `Username: Message` format.
1.  Create a new `.md` file (or edit `custom.md`).
2.  Ensure your system prompt instructs the AI to output in the `Name: Content` format.
3.  The extension handles grouping multi-paragraph responses automatically.

---

## 🖼 Interface Guide

<table>
  <tr>
    <th width="40%">Settings Panel</th>
    <th width="60%">Quick Settings Bar</th>
  </tr>
  <tr>
    <td valign="top">
       <a href="https://github.com/user-attachments/assets/7b6b9088-e600-4cbe-a569-6219061c7eee">
        <img src="https://github.com/user-attachments/assets/7b6b9088-e600-4cbe-a569-6219061c7eee" width="100%" alt="settings-panel" />
      </a>
      <br><i>Manage backends and styles</i>
    </td>
    <td valign="top">
      <a href="https://github.com/user-attachments/assets/db5eafb2-47fb-414c-9395-ed8f89fa6505">
        <img src="https://github.com/user-attachments/assets/db5eafb2-47fb-414c-9395-ed8f89fa6505" width="100%" alt="quick-settings-bar" />
      </a>
      <br><i>Toggle feed and user count instantly</i>
    </td>
  </tr>
</table>

## 🔒 Requirements
* **SillyTavern:** Version 1.12.0 or higher.
* **Backend:** Any Chat Completion API or Local LLM like **Ollama**, **KoboldCPP**, **vLLM**, etc.

## 🌟 Extras

### 🎨 EyeCare Theme
If you like the custom theme colors used in the screenshots, you can apply them to your SillyTavern interface:

<details>
<summary><strong>Click to view Theme JSON (Copy & Save as .json)</strong></summary>

```json
{
    "name": "EyeCare",
    "blur_strength": 0,
    "main_text_color": "rgba(230, 240, 255, 1)",
    "italics_text_color": "rgba(150, 220, 255, 1)",
    "underline_text_color": "rgba(255, 200, 100, 1)",
    "quote_text_color": "rgba(180, 255, 180, 1)",
    "blur_tint_color": "rgba(15, 20, 28, 1)",
    "chat_tint_color": "rgba(15, 20, 28, 1)",
    "user_mes_blur_tint_color": "rgba(22, 28, 38, 1)",
    "bot_mes_blur_tint_color": "rgba(18, 24, 32, 1)",
    "shadow_color": "rgba(0, 0, 0, 1)",
    "shadow_width": 0,
    "border_color": "rgba(70, 100, 140, 1)",
    "font_scale": 1,
    "fast_ui_mode": true,
    "waifuMode": false,
    "avatar_style": 2,
    "chat_display": 1,
    "toastr_position": "toast-top-right",
    "noShadows": true,
    "chat_width": 50,
    "timer_enabled": false,
    "timestamps_enabled": true,
    "timestamp_model_icon": true,
    "mesIDDisplay_enabled": false,
    "hideChatAvatars_enabled": false,
    "message_token_count_enabled": false,
    "expand_message_actions": true,
    "enableZenSliders": false,
    "enableLabMode": false,
    "hotswap_enabled": false,
    "custom_css": "/* Accessibility-Focused High Contrast Theme */\\n\\n/* Enhanced Text Clarity with Color Differentiation */\\n.mes_text {\\n  text-shadow: none !important;\\n  line-height: 1.8 !important;\\n  letter-spacing: 0.02em !important;\\n}\\n\\n.mes_text p {\\n  text-shadow: none !important;\\n  margin-bottom: 1em !important;\\n}\\n\\n/* Italics - Light Blue */\\n.mes_text em,\\n.mes_text i {\\n  color: rgba(150, 220, 255, 1) !important;\\n  font-style: italic !important;\\n  font-weight: 500 !important;\\n}\\n\\n/* Underline - Warm Orange */\\n.mes_text u {\\n  color: rgba(255, 200, 100, 1) !important;\\n  text-decoration: underline !important;\\n  text-decoration-thickness: 2px !important;\\n}\\n\\n/* Quotes - Soft Green */\\n.mes_text blockquote,\\n.mes_text q {\\n  color: rgba(180, 255, 180, 1) !important;\\n  border-left: 4px solid rgba(100, 255, 150, 1) !important;\\n  padding-left: 12px !important;\\n  margin-left: 8px !important;\\n  font-style: italic !important;\\n}\\n\\n/* Bold - Bright White */\\n.mes_text strong,\\n.mes_text b {\\n  color: rgba(255, 255, 255, 1) !important;\\n  font-weight: 700 !important;\\n}\\n\\n/* Clear Message Separation */\\n.mes {\\n  border: 2px solid rgba(70, 100, 140, 1) !important;\\n  margin-bottom: 20px !important;\\n  padding: 18px !important;\\n  background-color: rgba(22, 28, 38, 1) !important;\\n}\\n\\n/* Input Field Visibility */\\nselect, .form-control, .ui-widget-content {\\n  background-color: #141923 !important;\\n  color: #e6f0ff !important;\\n  border: 2px solid #46648c !important;\\n}\\n\\ninput[type=\\\"text\\\"], input[type=\\\"search\\\"], input[type=\\\"number\\\"],\\ntextarea, .form-control {\\n  background-color: #1a2230 !important;\\n  color: #e6f0ff !important;\\n  border: 2px solid #46648c !important;\\n  font-size: 1.1em !important;\\n}\\n\\n/* Dropdown Clarity */\\n.select2-container .select2-selection {\\n  background-color: #1a2230 !important;\\n  color: #e6f0ff !important;\\n  border: 2px solid #46648c !important;\\n}\\n\\n.select2-container .select2-selection__rendered {\\n  color: #e6f0ff !important;\\n}\\n\\n.select2-dropdown {\\n  background-color: #1a2230 !important;\\n  border: 2px solid #46648c !important;\\n}\\n\\n.select2-results__option {\\n  color: #e6f0ff !important;\\n  background-color: #1a2230 !important;\\n}\\n\\n.select2-results__option--highlighted {\\n  background-color: #2a3a50 !important;\\n  color: #ffffff !important;\\n}\\n\\n/* Button Clarity */\\nbutton, .menu_button {\\n  background-color: #242e3d !important;\\n  color: #e6f0ff !important;\\n  border: 2px solid #46648c !important;\\n  box-shadow: none !important;\\n  text-shadow: none !important;\\n}\\n\\nbutton:hover, .menu_button:hover {\\n  background-color: #2f3e54 !important;\\n  border-color: #5a7aa0 !important;\\n}\\n\\n/* Remove All Visual Effects */\\n.mes_buttons button,\\n.mes_buttons .fa-solid,\\n.mes_buttons i,\\n.fa-solid {\\n  box-shadow: none !important;\\n  text-shadow: none !important;\\n  filter: none !important;\\n}\\n\\n.mes_edit_buttons {\\n  filter: none !important;\\n}\\n\\n/* Section Headers */\\nh1, h2, h3, h4, h5, h6, .standoutHeader {\\n  background: #242e3d !important;\\n  color: #e6f0ff !important;\\n  border: 1px solid #46648c !important;\\n  padding: 8px !important;\\n  text-shadow: none !important;\\n}\\n\\n/* High Contrast Scrollbar */\\n::-webkit-scrollbar {\\n  width: 16px;\\n  background: #0f1418;\\n}\\n\\n::-webkit-scrollbar-thumb {\\n  background: #46648c;\\n  border: 2px solid #0f1418;\\n  border-radius: 8px;\\n}\\n\\n::-webkit-scrollbar-thumb:hover {\\n  background: #5a7aa0;\\n}\\n\\n/* Clear Chat Area */\\n#chat {\\n  padding: 20px !important;\\n  border: none !important;\\n}\\n\\n/* Navigation Panel */\\n#left-nav-panel {\\n  border: 2px solid #46648c !important;\\n}\\n\\n/* Form Area */\\n#send_form {\\n  border: 2px solid #46648c !important;\\n  border-radius: 8px !important;\\n  background-color: #141923 !important;\\n}\\n\\n#form_sheld {\\n  border-top: 2px solid #46648c !important;\\n  padding: 15px !important;\\n}\\n\\n/* Top Bar */\\n#top-bar {\\n  border-bottom: 2px solid #46648c !important;\\n  box-shadow: none !important;\\n}\\n\\n/* Link Visibility - Warm Amber */\\na {\\n  color: #ffc864 !important;\\n  text-decoration: underline !important;\\n  text-decoration-thickness: 2px !important;\\n}\\n\\na:hover {\\n  color: #ffdc8c !important;\\n}\\n\\n/* Avatar Clarity */\\n.avatar {\\n  box-shadow: none !important;\\n  filter: none !important;\\n  border: 2px solid #46648c !important;\\n}\\n\\n/* Code Block Readability */\\ncode, pre {\\n  background-color: #242e3d !important;\\n  color: #b4dcff !important;\\n  border: 1px solid #46648c !important;\\n  padding: 4px 8px !important;\\n}\\n\\n/* Modal/Popup Contrast */\\n.popup, .modal-content, .drawer-content {\\n  background-color: #141923 !important;\\n  border: 2px solid #46648c !important;\\n  color: #e6f0ff !important;\\n}\\n\\n/* World Info Readability */\\n#WorldInfo {\\n  max-width: 90vw !important;\\n  background-color: #141923 !important;\\n}\\n\\n.world_entry {\\n  background-color: #1a2230 !important;\\n  border: 2px solid #46648c !important;\\n}\\n\\n/* Improved Focus Indicators */\\ninput:focus, textarea:focus, select:focus, button:focus {\\n  outline: 3px solid #ffc864 !important;\\n  outline-offset: 2px !important;\\n}",
    "bogus_folders": false,
    "zoomed_avatar_magnification": false,
    "reduced_motion": true,
    "compact_input_area": false,
    "show_swipe_num_all_messages": false,
    "click_to_edit": false,
    "media_display": "list"
}
```
</details>

### 🎙️ Featured Scenario: Real Talk Podcast
The reactions in the examples above are based on this custom story I created. Use the card below to test the extension's behavior.

<table> <tr> <td width="35%" valign="top"> <img src="https://github.com/user-attachments/assets/beee7c3e-b40b-4f2d-a857-79329ab7038b" width="100%" alt="Real Talk Podcast Card" /> <p align="center"><sub><em>Right-click & Save image to import</em></sub></p> </td> <td width="65%" valign="top"> <strong>The Story:</strong> <blockquote> Victoria Cross, 38, built her podcast empire dissecting male mediocrity and modern dating's failures—until Daniel, 18, calls in and systematically dismantles her worldview on air. Their explosive debates accidentally spark the "New Pond Movement," urging older women to pursue younger men and leave the "stagnant pond" behind. As Daniel becomes a fixture on her show, the intellectual warfare between them ignites something far more dangerous than either anticipated. </blockquote> <p><strong>Import Options:</strong></p> <ul> <li> Character Card includes World Info & Lorebook Entries. </li> <li> Either download the image to the left and import. </li> <li> *OR* <a href="https://gist.githubusercontent.com/mattjaybe/8856eecdb2ada535095cbc35e107a4dc/raw/6490ea9f134a1c71272f0014fec31bc068d62469/realtalk-charactercard.json">Copy or Download the character card .json</a></li> </ul> </td> </tr> </table>
