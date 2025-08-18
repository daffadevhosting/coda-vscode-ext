// src/webview-ui/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, User, MessageCircleCode, Trash2, Copy, Check } from 'lucide-react';
import { VSCodeButton, VSCodeTextArea, VSCodeDropdown, VSCodeOption, VSCodeTag } from '@vscode/webview-ui-toolkit/react';
import './main.css';

// @ts-ignore
const vscode = acquireVsCodeApi();

interface Message {
    role: 'user' | 'model';
    text: string;
}

// [BARU] Tipe data untuk riwayat yang dikirim ke API
interface ChatHistoryMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}


const initialMessage: Message = {
    role: 'model',
    text: "👋 Halo! Saya CoDa, asisten AI Anda di VS Code.\n\nSaya di sini untuk membantu Anda dengan berbagai macam tugas pemrograman. Silakan ajukan pertanyaan atau berikan saya potongan kode untuk dianalisis."
};

// [BARU] Komponen kustom untuk blok kode dengan tombol copy
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeText = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset status setelah 2 detik
    };

    return !inline && match ? (
        <div className="code-block-wrapper">
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {codeText}
            </SyntaxHighlighter>
            <VSCodeButton appearance="icon" className="copy-button" onClick={handleCopy}>
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
            </VSCodeButton>
        </div>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

function App() {
    const [messages, setMessages] = useState<Message[]>([]); // [MODIFIKASI] Mulai dengan array kosong
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
        vscode.postMessage({ type: 'webviewReady' });

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'addUserMessage':
                    // Jika ini pesan pertama, ganti initial message, jika tidak, tambahkan
                    setMessages(prev => prev.length === 0 ? [message.data] : [...prev, message.data]);
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
                    break;
                // [BARU] Handler untuk memuat riwayat
                case 'loadHistory':
                    if (message.data.length > 0) {
                        setMessages(message.data);
                    } else {
                        setMessages([initialMessage]); // Tampilkan pesan awal jika history kosong
                    }
                    break;
                // [BARU] Handler untuk membersihkan chat di UI
                case 'clearChat':
                    setMessages([initialMessage]);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        if (textFieldRef.current) {
            textFieldRef.current.focus();
        }
        return () => window.removeEventListener('message', handleMessage);
    }, []); // [MODIFIKASI] Hapus 'messages' dari dependency array

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (inputText.trim()) {
            // [MODIFIKASI] Kirim pesan dan riwayat saat ini
            const newUserMessage: Message = { role: 'user', text: inputText };
            // Hapus initial message jika masih ada
            const currentMessages = messages[0] === initialMessage ? [] : messages;
            const updatedMessages = [...currentMessages, newUserMessage];
            setMessages(updatedMessages);

            // [BARU] Konversi format pesan untuk dikirim ke API
            const historyForApi: ChatHistoryMessage[] = updatedMessages
                .slice(0, -1) // Kirim semua kecuali pesan baru
                .map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }));

            vscode.postMessage({
                type: 'askQuestion',
                value: inputText,
                history: historyForApi // Kirim riwayat yang sudah diformat
            });
            setInputText('');
        }
    };
    
    // [BARU] Fungsi untuk membersihkan riwayat
    const handleClearHistory = () => {
        // Minta konfirmasi sebelum membersihkan
        const confirmClear = window.confirm("Are you sure you want to clear the chat history?");
        if (confirmClear) {
            vscode.postMessage({ type: 'clearHistory' });
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
             {/* [BARU] Header dengan tombol Clear */}
            <header className="header-container">
                <span className="header-title">CoDa AI</span>
                <VSCodeButton appearance="icon" aria-label="Clear history" onClick={handleClearHistory}>
                    <Trash2 size={16} />
                </VSCodeButton>
            </header>
            <section className="messages-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'model-message'}`}>
                        <MessageIcon role={msg.role} />
                        <div className="message-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}
                                components={{
                                    code: CodeBlock,
                                }}>{msg.text}</ReactMarkdown>
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