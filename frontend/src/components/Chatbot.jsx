import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Banking Assistant. Ask me anything about our customers, loans, or limits.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e, overrideInput = null) => {
    e.preventDefault();
    const queryToSend = overrideInput || input;
    if (!queryToSend.trim()) return;

    const userMessage = queryToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Exclude the initial greeting and the current user message (since it's added below)
      // Send the past messages for conversation memory
      const history = messages.filter((msg, idx) => idx > 0).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await api.sendChatMessage(userMessage, history);
      if (response.data.success) {
        const { answer, sources } = response.data.data;
        setMessages(prev => [...prev, { role: 'assistant', content: answer, sources }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the backend service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--navy-800)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '380px',
          height: '550px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--navy-800)',
            color: 'white',
            padding: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2em' }}>🤖</span>
            AI Banking Assistant (RAG)
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#f8f9fa'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{
                  backgroundColor: msg.role === 'user' ? 'var(--blue-600)' : '#ffffff',
                  color: msg.role === 'user' ? '#ffffff' : 'var(--text-900)',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
                  fontSize: '0.95em',
                  lineHeight: '1.4'
                }}>
                  {msg.content}
                </div>
                
                {/* Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    fontSize: '0.75em',
                    color: '#666',
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}>
                    <strong>Sources:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                      {msg.sources.map((s, i) => (
                        <li key={i}>{s.source} (Cust: {s.customer_id})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', color: '#666', fontSize: '0.9em', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div className="glyph" style={{ animation: 'spin 1s linear infinite' }}>◌</div>
                Searching database...
              </div>
            )}
            
            {/* Quick Suggestions - Only show when no user messages exist */}
            {messages.length === 1 && !isLoading && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '8px'
              }}>
                {[
                  "What types of loans do we offer?",
                  "Show me an example of a customer with a home loan.",
                  "What types of collaterals are accepted for credit limits?",
                  "Give me details of a customer living in Bangalore."
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion);
                      // Create a synthetic event to trigger handleSend
                      handleSend({ preventDefault: () => {} }, suggestion);
                    }}
                    style={{
                      backgroundColor: 'var(--gold-100)',
                      color: 'var(--navy-800)',
                      border: '1px solid var(--blue-500)',
                      borderRadius: '16px',
                      padding: '8px 12px',
                      fontSize: '0.85em',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--blue-500)'; e.target.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.target.style.backgroundColor = 'var(--gold-100)'; e.target.style.color = 'var(--navy-800)'; }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: '16px',
            backgroundColor: '#fff',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '8px'
          }}>
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about a customer..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                outline: 'none',
                fontSize: '0.95em'
              }}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor: 'var(--blue-600)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0 20px',
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.7 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
