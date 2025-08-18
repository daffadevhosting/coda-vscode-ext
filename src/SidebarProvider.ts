// src/SidebarProvider.ts

import * as vscode from 'vscode';
import { getNonce } from './getNonce';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'coda-vscode.chatView';

    private _view?: vscode.WebviewView;
    view: any;

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

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'webviewReady': {
                    // Send the initial data once the webview is ready
                    this.sendModelData();
                    break;
                }
                case 'askQuestion': {
                    if (!data.value) {
                        return;
                    }
                    vscode.commands.executeCommand('coda-vscode.askCoDa', data.value);
                    break;
                }
                case 'setModel': {
                    if (!data.value) {
                        return;
                    }
                    vscode.workspace.getConfiguration('coda-vscode').update('model', data.value, vscode.ConfigurationTarget.Global);
                    break;
                }
            }
        });
    }
    
    public postMessageToWebview(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
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
                <title>CoDa Chat</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}