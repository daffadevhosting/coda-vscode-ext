// src/webview-ui/App.tsx

import React, { useState, useEffect, useRef } from 'react';

// Dapatkan instance API VS Code yang telah disediakan di window
// @ts-ignore
const vscode = acquireVsCodeApi();

interface Message {
    role: 'user' | 'model';
    text: string;
}

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Listener untuk menerima pesan dari backend ekstensi

    useEffect(() => {
        const handleMessage = (event: any) => {
            const message = event.data;
            switch (message.type) {
                case 'addMessage':
                    setMessages(prevMessages => [...prevMessages, message.data]);
                    break;
                case 'replaceLastMessage':
                    setMessages(prevMessages => {
                        const newMessages = [...prevMessages];
                        newMessages[newMessages.length - 1] = message.data;
                        return newMessages;
                    });
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            // Kirim pesan ke backend ekstensi
            vscode.postMessage({
                type: 'askQuestion',
                value: inputText
            });
            // Tambahkan pesan pengguna ke UI secara langsung
            setMessages(prev => [...prev, { role: 'user', text: inputText }]);
            setInputText('');
        }
    };

    return (
        <div className="chat-container">
            <div className="messages-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <p>{msg.text}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask CoDa..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default App;