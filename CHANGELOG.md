# Change Log

All notable changes to the "coda-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.4] - 2025-08-19

### Changed

- **Refactored Ask CoDa Command**: Streamlined the logic for handling messages from the webview and command palette, ensuring a more consistent user experience.
- **Standardized AI Model Configuration**: Updated `package.json` to set `gemini-2.0-flash` as the default model and refined the available model options for consistency across the extension.

### Fixed

- **Inline Code Suggestions Logic**: Corrected the `InlineCompletionItemProvider` to use `fixCodeWithCoDa` for code suggestions, aligning with its intended purpose for code manipulation. The feature is now optional via a new setting (`coda-vscode.enableInlineSuggestions`), handles errors silently, and ensures all AI calls use the configured model.

## [0.0.3] - 2025-08-19

### Added

- **Persistent Chat History**: Conversations with CoDa are now automatically saved per workspace and restored when the webview is reloaded or VS Code is reopened.
- **Clear History Functionality**: A "Clear Chat" button has been added to the chat header, allowing users to easily reset the conversation history.
- **Copy-to-Clipboard for Code Blocks**: A "Copy" button now appears on hover over any code block in the chat, enabling one-click copying of code snippets.
- **Syntax Highlighting**: Implemented syntax highlighting for code blocks within the chat view to significantly improve readability and aesthetics.
- **Chat View Header**: Added a persistent header to the chat UI containing the extension's title and the new clear history button.

### Changed

- **Enhanced AI Prompt for Code Fixes**: Overhauled the prompt for the "Fix this code" feature. The new prompt is more robust, providing one-shot examples to the AI to ensure reliable JSON output, instructing it to infer context, and gracefully handling cases where no errors are found in the selected code. This dramatically improves the accuracy of code corrections.

## [0.0.2] - 2025-08-18

### Fixed

- **Robust AI Response Parsing**: Fixed a critical bug where the extension would crash if the AI's response for a code fix was not in the expected JSON format. The logic now gracefully handles alternative responses.
- **Dropdown Loading**: Resolved a persistent race condition that prevented the model selection dropdown from populating. Implemented a handshake (`webviewReady`) to ensure the UI is ready before receiving data.

## [0.0.1] - 2025-08-18

### Added

- **Model Selection in UI**: Added a dropdown menu directly in the chat view to allow switching the active AI model on the fly.
- **Modal Code Fix**: Implemented a Copilot-like modal dialog for the "Fix this code" feature. It now shows a diff in a popup and allows users to "Accept" or "Discard" the suggestion.

### Changed

- **Complete UI Overhaul**: Revamped the entire chat interface to align with VS Code's native look and feel, using VS Code theme variables for colors and controls.
- **Modern Chat Layout**: User messages are now aligned to the right, creating a more intuitive and familiar chat experience.
- **Native UI Components**: Replaced all standard HTML form elements with components from the `@vscode/webview-ui-toolkit` for a more integrated feel.
- **Enhanced Input Area**: The text input is now a multi-line `textarea`, with the send button conveniently located inside it.
- **Build Process Cleanup**: Removed Tailwind CSS and its related dependencies (`postcss`, `autoprefixer`), resulting in a cleaner and more lightweight build process.
- **Send Shortcut**: Changed the keyboard shortcut for sending a message to `Ctrl+Enter` (or `Cmd+Enter`) to allow for multi-line inputs.

## [Unreleased]

- Initial release