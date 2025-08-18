// src/webview-ui/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Sparkles, MessageCircleCode } from 'lucide-react';
import { VSCodeButton, VSCodeTextArea, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import './main.css';

// @ts-ignore
const vscode = acquireVsCodeApi();

interface Message {
    role: 'user' | 'model';
    text: string;
}

const initialMessage: Message = {
    role: 'model',
    text: "👋 Hi! I'm CoDa, your AI assistant in VS Code.\nI'm here to help you with a variety of programming tasks. Feel free to ask questions or provide me with code snippets to analyze."
};

function App() {
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textFieldRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'addUserMessage':
                    // Replace initial message if it's the first user message
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
        // Focus the text field on load
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
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
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
                        <Send size={16} />
                    </VSCodeButton>
                </div>
            </footer>
        </main>
    );
}

export default App;
