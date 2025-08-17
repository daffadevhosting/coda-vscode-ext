// src/webview-ui/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// @ts-ignore
const vscode = acquireVsCodeApi();

interface Message {
    role: 'user' | 'model';
    text: string;
}

const initialMessage: Message = {
    role: 'model',
    text: "👋 Halo! Saya CoDa, asisten AI Anda di VS Code.\n\nSaya di sini untuk membantu Anda:\n\n- **Menjawab pertanyaan** seputar coding & teknologi.\n- **Mencari bug** dalam potongan kode Anda.\n- **Memberikan ide** untuk proyek Anda.\n\nSilakan mulai dengan mengetik pesan di bawah ini."
};

function App() {
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
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
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            vscode.postMessage({ type: 'askQuestion', value: inputText });
            setInputText('');
        }
    };

    return (
        <main>
            <section className="messages-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </section>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask CoDa..."
                />
                <button type="submit">Send</button>
            </form>
        </main>
    );
}

export default App;