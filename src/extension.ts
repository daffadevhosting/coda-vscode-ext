// src/extension.ts
import * as vscode from 'vscode';
import { askCoDa, fixCodeWithCoDa, ChatMessage } from './coda-ai';
import { SidebarProvider } from './SidebarProvider';

// Kelas untuk menangani "Quick Fix" / "Lampu Bohlam"
class CodaActionProvider implements vscode.CodeActionProvider {

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
        // Hanya tampilkan aksi jika ada teks yang diseleksi
        if (range.isEmpty) {
            return;
        }

        const fixAction = new vscode.CodeAction('CoDa: Fix this code', vscode.CodeActionKind.QuickFix);
        fixAction.command = { 
            command: 'coda-vscode.fixError', 
            title: 'Let CoDa fix this code', 
            arguments: [document, range] 
        };
        
        return [fixAction];
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "coda-vscode" is now active!');

    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
    );

    // Daftarkan Code Action Provider kita untuk berbagai bahasa
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: '*' }, // Berlaku untuk semua bahasa
            new CodaActionProvider(),
            { providedCodeActionKinds: CodaActionProvider.providedCodeActionKinds }
        )
    );

	// Perintah Ask CoDa di sidebar (tetap sama)
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
	context.subscriptions.push(askCoDaCommand);

    // [UPGRADED] Perintah "fixError" yang dipanggil oleh Code Action
    let fixErrorCommand = vscode.commands.registerCommand('coda-vscode.fixError', async (document: vscode.TextDocument, range: vscode.Range) => {
        const selectedText = document.getText(range);
        const languageId = document.languageId;
        const apiKey = vscode.workspace.getConfiguration('coda-vscode').get<string>('apiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage('Gemini API Key is not set.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "CoDa is analyzing your code...",
            cancellable: false
        }, async () => {
            const result = await fixCodeWithCoDa(apiKey, selectedText, languageId);

            if (result.error) {
                vscode.window.showErrorMessage(`CoDa Error: ${result.error}`);
            } else if (result.response) {
                try {
                    const jsonResponse = JSON.parse(result.response);
                    const { fixedCode, explanation } = jsonResponse;

                    if (fixedCode) {
                        // Tampilkan popup perbandingan (diff view)
                        vscode.commands.executeCommand('vscode.diff',
                            document.uri, // Dokumen asli
                            vscode.Uri.parse(`untitled:${document.fileName}-coda-fix.git`), // Dokumen "baru"
                            `Original vs. CoDa Fix: ${explanation || ''}`,
                            {
                                preview: true,
                                selection: range
                            }
                        );
                    } else {
                        throw new Error("AI did not provide 'fixedCode'.");
                    }
                } catch (e: any) {
                    vscode.window.showErrorMessage(`CoDa Error: Failed to parse AI response. ${e.message}`);
                }
            }
        });
    });

    context.subscriptions.push(fixErrorCommand);
}

export function deactivate() {}