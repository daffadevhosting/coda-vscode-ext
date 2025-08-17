// src/extension.ts

import * as vscode from 'vscode';
import { askCoDa, ChatMessage } from './coda-ai';
import { SidebarProvider } from './SidebarProvider'; // <-- Impor SidebarProvider

// Riwayat obrolan akan disimpan di sini selama sesi berjalan
let chatHistory: ChatMessage[] = [];

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "coda-vscode" is now active!');

	// Buat instance dari SidebarProvider
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
	);

	// Daftarkan perintah baru kita: coda-vscode.askCoDa
	let askCoDaCommand = vscode.commands.registerCommand('coda-vscode.askCoDa', async (userMessage?: string) => {
		
		// Jika tidak ada pesan dari UI, minta input manual (untuk jaga-jaga)
		if (!userMessage) {
			userMessage = await vscode.window.showInputBox({ prompt: "Ask CoDa..." });
		}
		if (!userMessage) return;


		const config = vscode.workspace.getConfiguration('coda-vscode');
		const apiKey = config.get<string>('apiKey');

		if (!apiKey) {
			vscode.window.showErrorMessage(
				'Gemini API Key is not set. Please set it in the VS Code settings.',
				'Open Settings'
			).then(selection => {
				if (selection === 'Open Settings') {
					vscode.commands.executeCommand('workbench.action.openSettings', 'coda-vscode.apiKey');
				}
			});
			return;
		}

		// Kirim pesan "thinking" ke UI
		sidebarProvider.postMessageToWebview({ type: 'addMessage', data: { role: 'model', text: 'Thinking...' } });

		// Panggil "otak" AI
		const result = await askCoDa(apiKey, chatHistory, userMessage);

		if (result.error) {
			vscode.window.showErrorMessage(result.error);
			// Kirim pesan error ke UI untuk menggantikan "Thinking..."
			sidebarProvider.postMessageToWebview({ type: 'replaceLastMessage', data: { role: 'model', text: `Error: ${result.error}` } });

		} else if (result.response) {
			// Simpan riwayat
			chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
			chatHistory.push({ role: 'model', parts: [{ text: result.response }] });

			// Kirim jawaban final ke UI untuk menggantikan "Thinking..."
			sidebarProvider.postMessageToWebview({ type: 'replaceLastMessage', data: { role: 'model', text: result.response } });
		}
	});

	context.subscriptions.push(askCoDaCommand);
}

export function deactivate() {}