// src/webview-ui/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, MessageCircleCode } from 'lucide-react';
import { VSCodeButton, VSCodeTextArea, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import './main.css';

// @ts-ignore
const vscode = acquireVsCodeApi();

interface Message {
    role: 'user' | 'model';
    text: string;
}

const initialMessage: Message = {
    role: 'model',
    text: "👋 Halo! Saya CoDa, asisten AI Anda di VS Code.\n\nSaya di sini untuk membantu Anda dengan berbagai macam tugas pemrograman. Silakan ajukan pertanyaan atau berikan saya potongan kode untuk dianalisis."
};

function App() {
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [inputText, setInputText] = useState('');
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textFieldRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        // Signal to the extension that the webview is ready
        vscode.postMessage({ type: 'webviewReady' });

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'addUserMessage':
                    if (messages.length === 1 && messages[0] === initialMessage) {
                        setMessages([message.data]);
                    } else {
                        setMessages(prev => [...prev, message.data]);
                    }
                    break;
                case 'addMessage':
                    setMessages(prev => [...prev, message.data]);
                    break;
                case 'replaceLastMessage':
                    setMessages(prev => {
                        const newMessages = [...prev];
                        if (newMessages.length > 0) {
                            newMessages[newMessages.length - 1] = message.data;
                        }
                        return newMessages;
                    });
                    break;
                case 'updateModels':
                    setModels(message.data.models || []);
                    setSelectedModel(message.data.currentModel || '');
                    // DEBUG: Send confirmation back to extension
                    vscode.postMessage({ type: 'debug', value: `Received ${message.data.models.length} models.` });
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        if (textFieldRef.current) {
            textFieldRef.current.focus();
        }
        return () => window.removeEventListener('message', handleMessage);
    }, [messages]);

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (inputText.trim()) {
            vscode.postMessage({ type: 'askQuestion', value: inputText });
            setInputText('');
        }
    };
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleModelChange = (e: any) => {
        const newModel = e.target.value;
        setSelectedModel(newModel);
        vscode.postMessage({ type: 'setModel', value: newModel });
    };

    const MessageIcon = ({ role }: { role: 'user' | 'model' }) => (
        <div className="message-icon">
            {role === 'user' ? <User size={18} /> : <MessageCircleCode size={18} />}
        </div>
    );

    return (
        <main className="container">
            <section className="messages-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'model-message'}`}>
                        <MessageIcon role={msg.role} />
                        <div className="message-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </section>
            <footer className="form-container">
                <VSCodeDropdown value={selectedModel} onChange={handleModelChange} className="model-dropdown">
                    {models.map(model => (
                        <VSCodeOption key={model} value={model}>{model}</VSCodeOption>
                    ))}
                </VSCodeDropdown>
                <div className="input-wrapper">
                    <VSCodeTextArea
                        ref={textFieldRef}
                        className="input-field"
                        value={inputText}
                        placeholder="Ask CoDa (Ctrl+Enter to send)..."
                        rows={2}
                        onInput={(e: any) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <VSCodeButton 
                        appearance="icon" 
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim()}
                        className="send-button"
                    >
                        <Send size={18} />
                    </VSCodeButton>
                </div>
            </footer>
        </main>
    );
}

export default App;