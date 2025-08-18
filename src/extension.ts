// src/extension.ts
import * as vscode from 'vscode';
import { askCoDa, fixCodeWithCoDa, ChatMessage } from './coda-ai';
import { SidebarProvider } from './SidebarProvider';

// Nama kunci untuk menyimpan API key di SecretStorage
const API_KEY_SECRET_KEY = 'coda-gemini-api-key';
// [BARU] Nama kunci untuk menyimpan riwayat obrolan
const CHAT_HISTORY_KEY = 'coda-chat-history';

// Fungsi helper untuk mendapatkan API key dari brankas
async function getApiKey(secrets: vscode.SecretStorage): Promise<string | undefined> {
    return await secrets.get(API_KEY_SECRET_KEY);
}

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

    const sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
    );

    // [BARU] Perintah untuk mengatur API Key
    let setApiKeyCommand = vscode.commands.registerCommand('coda-vscode.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: "Please enter your Google Gemini API Key",
            password: true, // Menyembunyikan input
            ignoreFocusOut: true,
        });

        if (apiKey) {
            await context.secrets.store(API_KEY_SECRET_KEY, apiKey);
            vscode.window.showInformationMessage("CoDa: API Key saved successfully!");
        }
    });
    context.subscriptions.push(setApiKeyCommand);

    // [BARU] Perintah untuk menghapus API Key
    let clearApiKeyCommand = vscode.commands.registerCommand('coda-vscode.clearApiKey', async () => {
        await context.secrets.delete(API_KEY_SECRET_KEY);
        vscode.window.showInformationMessage("CoDa: API Key cleared successfully!");
    });
    context.subscriptions.push(clearApiKeyCommand);

    // Daftarkan Code Action Provider kita untuk berbagai bahasa
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: '*' }, // Berlaku untuk semua bahasa
            new CodaActionProvider(),
            { providedCodeActionKinds: CodaActionProvider.providedCodeActionKinds }
        )
    );

    // [DIMODIFIKASI] Fungsi helper untuk memeriksa API Key sebelum menjalankan perintah
    const ensureApiKey = async (): Promise<string | undefined> => {
        let apiKey = await getApiKey(context.secrets);
        if (!apiKey) {
            const selection = await vscode.window.showErrorMessage(
                'Gemini API Key is not set. Please set it to use CoDa.',
                'Set API Key'
            );
            if (selection === 'Set API Key') {
                await vscode.commands.executeCommand('coda-vscode.setApiKey');
                apiKey = await getApiKey(context.secrets); // Coba ambil lagi setelah di-set
            }
        }
        return apiKey;
    };

    // [DIMODIFIKASI] Perintah Ask CoDa di sidebar
    let askCoDaCommand = vscode.commands.registerCommand('coda-vscode.askCoDa', async (userMessage?: string, history?: ChatMessage[]) => {
        if (!sidebarProvider.view) {
            await vscode.commands.executeCommand('coda-vscode.chatView.focus');
        } else {
            sidebarProvider.view.show?.(true);
        }

        // Jika userMessage tidak diberikan dari webview, tampilkan input box
        if (!userMessage) {
            userMessage = await vscode.window.showInputBox({ prompt: "Ask CoDa..." });
            if (!userMessage) return; // Batalkan jika tidak ada input
             // Jika dipanggil dari input box, kirim pesan ke webview
            sidebarProvider.postMessageToWebview({ type: 'addUserMessage', data: { role: 'user', text: userMessage } });
        }

        const apiKey = await ensureApiKey();
        if (!apiKey) {
            return; // API key tidak ada, hentikan eksekusi
        }

        const modelName = vscode.workspace.getConfiguration('coda-vscode').get<string>('model') || 'gemini-2.5-flash';

        // Tampilkan status "thinking..."
        sidebarProvider.postMessageToWebview({ type: 'addMessage', data: { role: 'model', text: 'Thinking...' } });

        // Dapatkan riwayat dari argumen atau dari state jika tidak ada
        const currentHistory = history || context.workspaceState.get<ChatMessage[]>(CHAT_HISTORY_KEY) || [];

        const result = await askCoDa(apiKey, currentHistory, userMessage, modelName);

        // [BARU] Bentuk pesan balasan dari model
        const modelResponse: ChatMessage = {
            role: 'model',
            parts: [{ text: result.response || `Error: ${result.error}` }]
        };

        // Ganti pesan "Thinking..." dengan respons dari AI
        sidebarProvider.postMessageToWebview({
            type: 'replaceLastMessage',
            data: { role: 'model', text: modelResponse.parts[0].text }
        });

        // [BARU] Update dan simpan riwayat baru
        if (!result.error) {
            const userRequest: ChatMessage = { role: 'user', parts: [{ text: userMessage }] };
            const newHistory = [...currentHistory, userRequest, modelResponse];
            await context.workspaceState.update(CHAT_HISTORY_KEY, newHistory);
        }
    });

    context.subscriptions.push(askCoDaCommand);

    // [UPGRADED] Perintah "fixError" yang dipanggil oleh Code Action
    let fixErrorCommand = vscode.commands.registerCommand('coda-vscode.fixError', async (document: vscode.TextDocument, range: vscode.Range) => {
        const selectedText = document.getText(range);
        const languageId = document.languageId;
        const apiKey = await ensureApiKey();

        if (!apiKey) {
            return;
        }

        const modelName = vscode.workspace.getConfiguration('coda-vscode').get<string>('model') || 'gemini-2.5-flash';

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "CoDa is analyzing your code...",
            cancellable: false
        }, async () => {
            const result = await fixCodeWithCoDa(apiKey, selectedText, languageId, modelName);

            if (result.error) {
                vscode.window.showErrorMessage(`CoDa Error: ${result.error}`);
            } else if (result.response) {
                try {
                    const jsonResponse = JSON.parse(result.response);
                    const { fixedCode, explanation } = jsonResponse;

                    if (fixedCode) {
                        const originalText = document.getText(range);
                        const diffDetail = `--- Original\n+++ CoDa's Fix\n@@\n-${originalText.split('\n').join('\n-')}\n+${fixedCode.split('\n').join('\n+')}`;

                        const selection = await vscode.window.showInformationMessage(
                            explanation || "CoDa has a suggestion for you",
                            {
                                modal: true,
                                detail: diffDetail
                            },
                            'Accept',
                            'Discard'
                        );

                        if (selection === 'Accept') {
                            const edit = new vscode.WorkspaceEdit();
                            edit.replace(document.uri, range, fixedCode);
                            await vscode.workspace.applyEdit(edit);
                            vscode.window.showInformationMessage("CoDa's fix has been applied.");
                        }

                    } else if (explanation) {
                        vscode.window.showInformationMessage(`CoDa: ${explanation}`);
                    } else {
                        vscode.window.showWarningMessage("CoDa did not provide a fix or an explanation.");
                    }
                } catch (e) {
                    vscode.window.showInformationMessage(`CoDa says: "${result.response}"`);
                }
            }
        });
    });

    context.subscriptions.push(fixErrorCommand);
}

export function deactivate() { }