import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../../services/aiService';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hey there! 👋 I\'m your AI career assistant. Need help with job searching, resume tips, interview prep, or career advice? Just ask!'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.slice(1).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await chatWithAI(input, history);
            setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Oops! Something went wrong. Please try again in a moment. 🔄'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Custom styles for dark theme with glassmorphism
    const styles = {
        toggleButton: {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg) scale(0.9)' : 'rotate(0deg) scale(1)',
        },
        chatWindow: {
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '380px',
            height: '560px',
            borderRadius: '24px',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(26, 27, 35, 0.98) 0%, rgba(15, 16, 22, 0.99) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        header: {
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
        },
        avatarContainer: {
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        },
        headerTitle: {
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#f1f5f9',
            letterSpacing: '-0.02em',
        },
        headerSubtitle: {
            margin: '2px 0 0 0',
            fontSize: '12px',
            color: 'rgba(148, 163, 184, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        onlineDot: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
            animation: 'pulse 2s infinite',
        },
        messagesContainer: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            scrollBehavior: 'smooth',
        },
        userMessage: {
            alignSelf: 'flex-end',
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: '18px 18px 4px 18px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontSize: '14px',
            lineHeight: '1.5',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
            wordBreak: 'break-word',
        },
        assistantMessage: {
            alignSelf: 'flex-start',
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 4px',
            background: 'rgba(51, 55, 69, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#e2e8f0',
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
        },
        typingIndicator: {
            alignSelf: 'flex-start',
            padding: '14px 18px',
            borderRadius: '18px 18px 18px 4px',
            background: 'rgba(51, 55, 69, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
        },
        typingDot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            animation: 'typingBounce 1.4s infinite ease-in-out',
        },
        inputContainer: {
            padding: '16px 20px 20px',
            background: 'rgba(15, 16, 22, 0.8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        },
        inputWrapper: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            background: 'rgba(51, 55, 69, 0.4)',
            borderRadius: '16px',
            padding: '6px 6px 6px 18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'all 0.2s ease',
        },
        input: {
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f1f5f9',
            fontSize: '14px',
            padding: '10px 0',
            fontFamily: 'inherit',
        },
        sendButton: {
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            transition: 'all 0.2s ease',
            opacity: input.trim() && !isLoading ? 1 : 0.5,
            transform: input.trim() && !isLoading ? 'scale(1)' : 'scale(0.95)',
        },
    };

    return (
        <>
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes typingBounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-6px); }
                }
                .chat-messages::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-messages::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(102, 126, 234, 0.3);
                    border-radius: 3px;
                }
                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: rgba(102, 126, 234, 0.5);
                }
                .chat-input::placeholder {
                    color: rgba(148, 163, 184, 0.6);
                }
                .toggle-btn:hover {
                    transform: scale(1.08) !important;
                    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255,255,255,0.15) !important;
                }
                .send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                }
                .input-wrapper:focus-within {
                    border-color: rgba(102, 126, 234, 0.5) !important;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
                }
            `}</style>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.toggleButton}
                className="toggle-btn"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={styles.chatWindow}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.avatarContainer}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                                <circle cx="9" cy="13" r="1" fill="white" />
                                <circle cx="15" cy="13" r="1" fill="white" />
                                <path d="M9 17h6" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h3 style={styles.headerTitle}>AI Career Assistant</h3>
                            <p style={styles.headerSubtitle}>
                                <span style={styles.onlineDot}></span>
                                Powered by Groq AI
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={styles.messagesContainer} className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
                            >
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={styles.typingIndicator}>
                                <div style={{ ...styles.typingDot, animationDelay: '0s' }}></div>
                                <div style={{ ...styles.typingDot, animationDelay: '0.2s' }}></div>
                                <div style={{ ...styles.typingDot, animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={styles.inputContainer}>
                        <div style={styles.inputWrapper} className="input-wrapper">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                style={styles.input}
                                className="chat-input"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                style={styles.sendButton}
                                className="send-btn"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatWidget;

