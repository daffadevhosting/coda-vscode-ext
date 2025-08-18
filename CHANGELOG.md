# Change Log

All notable changes to the "coda-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0] - 2025-08-18

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

### Fixed

- **Robust AI Response Parsing**: Fixed a critical bug where the extension would crash if the AI's response for a code fix was not in the expected JSON format. The logic now gracefully handles alternative responses.
- **Dropdown Loading**: Resolved a persistent race condition that prevented the model selection dropdown from populating. Implemented a handshake (`webviewReady`) to ensure the UI is ready before receiving data.

## [Unreleased]

- Initial release
