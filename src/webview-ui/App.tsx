// src/webview-ui/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './main.css';

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
    <main className="bg-transparent text-white flex flex-col h-screen p-2">
        <section className="flex-1 overflow-y-auto">
            {messages.map((msg, index) => (
                <div key={index} 
                    className={`prose prose-invert prose-pre-wrap max-w-none w-fit mb-2 p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 ml-auto' : 'bg-gray-700 mr-auto'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </section>
        <form onSubmit={handleSendMessage} className="flex-shrink-0 flex items-center p-2 border-t border-gray-600">
            <input
                type="text"
                className="flex-1 bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask CoDa..."
            />
            <button type="submit" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Send
            </button>
        </form>
    </main>
    );
}

export default App;