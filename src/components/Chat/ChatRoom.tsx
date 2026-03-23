'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/types/token';

const NEON_COLORS = [
  '#00f0ff', '#ff00ff', '#00ff88', '#ff6600', '#8b5cf6',
  '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899',
];

function randomColor(): string {
  return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
}

export default function ChatRoom() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'system-1',
      nickname: '🤖 Archipelago',
      text: 'Welcome to Bags Archipelago! Explore the neon islands and chat with other explorers.',
      timestamp: Date.now(),
      color: '#00f0ff',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [nickname, setNickname] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [userColor] = useState(randomColor);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (!nickname) {
      setShowNicknameModal(true);
      return;
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      nickname,
      text: inputText.trim(),
      timestamp: Date.now(),
      color: userColor,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  const handleSetNickname = () => {
    if (!nickname.trim()) return;
    setShowNicknameModal(false);
    // Re-send the pending message
    if (inputText.trim()) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        nickname: nickname.trim(),
        text: inputText.trim(),
        timestamp: Date.now(),
        color: userColor,
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputText('');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="chat-toggle-icon">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && messages.length > 1 && (
          <span className="chat-badge">{messages.length - 1}</span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <span className="chat-header-dot" />
                <h3>Global Chat</h3>
              </div>
              <span className="chat-online">{Math.floor(Math.random() * 50 + 10)} online</span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className="chat-message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="chat-msg-header">
                    <span className="chat-msg-nick" style={{ color: msg.color }}>
                      {msg.nickname}
                    </span>
                    <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="chat-msg-text">{msg.text}</p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <input
                type="text"
                className="chat-input"
                placeholder={nickname ? 'Type a message...' : 'Set nickname to chat...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="chat-send-btn" onClick={handleSend}>
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nickname Modal */}
      <AnimatePresence>
        {showNicknameModal && (
          <motion.div
            className="nickname-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="nickname-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3>Choose a Nickname</h3>
              <p>Enter a name to start chatting in the Archipelago</p>
              <input
                type="text"
                className="nickname-input"
                placeholder="Explorer..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetNickname()}
                autoFocus
                maxLength={20}
              />
              <div className="nickname-actions">
                <button
                  className="nickname-cancel"
                  onClick={() => setShowNicknameModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="nickname-confirm"
                  onClick={handleSetNickname}
                >
                  Enter Archipelago
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
