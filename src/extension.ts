// src/extension.ts
import * as vscode from 'vscode';
import { askCoDa, ChatMessage, fixCodeWithCoDa } from './coda-ai';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "coda-vscode" is now active!');

	const sidebarProvider = new SidebarProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			SidebarProvider.viewType,
			sidebarProvider
		)
	);

	let askCoDaCommand = vscode.commands.registerCommand('coda-vscode.askCoDa', async (userMessage?: string) => {
		if (!sidebarProvider.view) {
			await vscode.commands.executeCommand('coda-vscode.chatView.focus');
		} else {
			sidebarProvider.view.show?.(true);
		}

		if (!userMessage) {
			userMessage = await vscode.window.showInputBox({ prompt: "Ask CoDa..." });
		}
		if (!userMessage) return;

		const apiKey = vscode.workspace.getConfiguration('coda-vscode').get<string>('apiKey');

		if (!apiKey) {
			vscode.window.showErrorMessage('Gemini API Key is not set in settings.');
			return;
		}

		// Langsung kirim pesan pengguna dan status "thinking" ke UI
        sidebarProvider.postMessageToWebview({ type: 'addUserMessage', data: { role: 'user', text: userMessage } });
		sidebarProvider.postMessageToWebview({ type: 'addMessage', data: { role: 'model', text: 'Thinking...' } });

		const result = await askCoDa(apiKey, [], userMessage); // History belum diimplementasikan

		if (result.error) {
			sidebarProvider.postMessageToWebview({ type: 'replaceLastMessage', data: { role: 'model', text: `Error: ${result.error}` } });
		} else if (result.response) {
			sidebarProvider.postMessageToWebview({ type: 'replaceLastMessage', data: { role: 'model', text: result.response } });
		}
	});
	// [BARU] Daftarkan perintah untuk memperbaiki error
	let fixErrorCommand = vscode.commands.registerCommand('coda-vscode.fixError', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // Tidak ada editor yang aktif
		}

		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);

		if (!selectedText) {
			vscode.window.showInformationMessage('CoDa: Please select the code you want to fix.');
			return;
		}

		const apiKey = vscode.workspace.getConfiguration('coda-vscode').get<string>('apiKey');
		if (!apiKey) {
			vscode.window.showErrorMessage('Gemini API Key is not set in settings.');
			return;
		}

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "CoDa is fixing your code...",
			cancellable: false
		}, async (progress) => {
			const result = await fixCodeWithCoDa(apiKey, selectedText);

			if (result.error) {
				vscode.window.showErrorMessage(`CoDa Error: ${result.error}`);
			} else if (result.response) {
				// Ganti teks yang diseleksi dengan hasil perbaikan dari AI
				editor.edit(editBuilder => {
					editBuilder.replace(selection, result.response!);
				});
				vscode.window.showInformationMessage('CoDa has fixed your code!');
			}
		});
	});

	context.subscriptions.push(askCoDaCommand, fixErrorCommand);
}

export function deactivate() {}