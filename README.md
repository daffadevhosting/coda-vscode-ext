# CoDa - Your AI Coding Companion for VS Code

![CoDa Icon](https://raw.githubusercontent.com/daffadevhosting/coda-vscode-ext/refs/heads/master/media/coda-icon.png)

**CoDa** is an AI assistant powered by Google's most advanced models, integrated directly into your Visual Studio Code environment. It's designed to be your co-pilot, helping you chat about ideas, fix broken code, and boost your productivity without ever leaving the editor.

---

## Features

- **💬 Conversational AI Chat**: A seamless chat interface in your sidebar to discuss concepts, debug code snippets, or brainstorm ideas.
- **💡 Smart Quick Fixes**: Select any piece of code and get intelligent repair suggestions through the Quick Fix lightbulb menu.
- **✨ Copilot-like Modal Suggestions**: Code fixes are presented in a modal dialog, allowing you to review and **Accept** or **Discard** changes, keeping you in control.
- **🤖 On-the-fly Model Selection**: Switch between powerful Google AI models (like Gemini Pro and Flash) directly from a dropdown in the chat view.
- **🎨 Adaptive UI**: The user interface automatically adapts to your VS Code theme for a native and comfortable look.

---

## Getting Started

It only takes two steps to get started:

1.  **Install the Extension**: Search for **"CoDa"** in the Visual Studio Marketplace and click **Install**.
2.  **Set Your API Key**:
    *   Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette.
    *   Type `CoDa: Set Gemini API Key` and press Enter.
    *   Paste your Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/apikey).

Your key is stored securely using VS Code's `SecretStorage`.

---

## How to Use

### Chatting with CoDa

1.  Click the **CoDa icon** in the Activity Bar (the far-left sidebar) to open the chat view.
2.  Select the AI model you want to use from the dropdown at the bottom.
3.  Type your message in the text area. Press **`Ctrl+Enter`** (`Cmd+Enter` on Mac) to send.

### Fixing Code

1.  In your code file, **select the block of code** you want to fix.
2.  Click the **lightbulb icon** that appears next to it, or press `Ctrl+.` (`Cmd+.` on Mac).
3.  Select **"CoDa: Fix this code"** from the menu.
4.  A modal popup will appear with a proposed fix and an explanation. Review the changes and click **Accept** to apply them directly to your code.

---

Happy coding! 🚀
