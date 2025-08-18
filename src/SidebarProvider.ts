// src/SidebarProvider.ts

import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { ChatMessage } from './coda-ai'; // [BARU] Impor tipe ChatMessage

const CHAT_HISTORY_KEY = 'coda-chat-history'; // [BARU] Pastikan key konsisten

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'coda-vscode.chatView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('coda-vscode.model')) {
                this.sendModelData();
            }
        });


        // [MODIFIKASI] Listener pesan sekarang menangani dialog
        webviewView.webview.onDidReceiveMessage(async (data) => { // <-- Tambahkan async
            switch (data.type) {
                case 'webviewReady': {
                    this.sendModelData();
                    this.sendChatHistory();
                    break;
                }
                case 'askQuestion': {
                    if (!data.value || !data.history) {
                        return;
                    }
                    vscode.commands.executeCommand('coda-vscode.askCoDa', data.value, data.history);
                    break;
                }
                case 'setModel': {
                    if (!data.value) {
                        return;
                    }
                    vscode.workspace.getConfiguration('coda-vscode').update('model', data.value, vscode.ConfigurationTarget.Global);
                    break;
                }
                // [MODIFIKASI TOTAL] Logika clearHistory sekarang ada di sini
                case 'clearHistory': {
                    const selection = await vscode.window.showInformationMessage(
                        "Are you sure you want to clear the chat history?",
                        { modal: true }, // Membuat dialog ini memblokir interaksi lain
                        "Yes",
                        "No"
                    );

                    if (selection === "Yes") {
                        // Hapus state
                        await this._context.workspaceState.update(CHAT_HISTORY_KEY, []);
                        // Kirim ulang riwayat (yang sekarang kosong) ke UI
                        this.sendChatHistory(); 
                        vscode.window.showInformationMessage("CoDa: Chat history has been cleared.");
                    }
                    break;
                }
            }
        });
    }

    public get view(): vscode.WebviewView | undefined {
        return this._view;
    }
    
    // [MODIFIKASI] Buat fungsi ini publik agar bisa diakses dari extension.ts
    public postMessageToWebview(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    // [BARU] Fungsi untuk mengirim riwayat obrolan ke webview
    public sendChatHistory() {
        if (this._view) {
            const history = this._context.workspaceState.get<ChatMessage[]>(CHAT_HISTORY_KEY) || [];
            // Konversi format agar sesuai dengan yang diharapkan UI
            const formattedHistory = history.map(msg => ({
                role: msg.role,
                text: msg.parts[0].text
            }));
            this.postMessageToWebview({ type: 'loadHistory', data: formattedHistory });
        }
    }


    public sendModelData() {
        if (this._view) {
            const models = this._context.extension.packageJSON?.contributes?.configuration?.properties?.['coda-vscode.model']?.enum || [];
            const currentModel = vscode.workspace.getConfiguration('coda-vscode').get<string>('model');

            this.postMessageToWebview({
                type: 'updateModels',
                data: {
                    models,
                    currentModel
                }
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'out', 'webview.js'));
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>CoDa Code</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}