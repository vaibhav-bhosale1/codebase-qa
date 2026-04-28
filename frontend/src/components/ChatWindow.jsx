import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import CitationChip from './CitationChip';

export default function ChatWindow({ messages, isLoading, selectedRepo, onSendMessage, onSelectCitation }) {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef(null);

  // Scroll the CONTAINER div, not the page
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedRepo) return;
    onSendMessage(input);
    setInput('');
  };

  if (!selectedRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/50 p-8">
        <Bot className="w-16 h-16 mb-6 opacity-20" />
        <h2 className="text-2xl font-light text-white/80">Select a repository</h2>
        <p className="mt-2 text-sm text-white/40">Choose from the sidebar or ingest a new codebase to begin.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      <div className="glass-panel border-b-0 border-x-0 p-4 text-center z-10" style={{ flexShrink: 0 }}>
        <span className="text-xs font-medium text-white/50 tracking-wide uppercase">
          Querying: <span className="text-white ml-1">{selectedRepo}</span>
        </span>
      </div>

      {/* Attach ref here and scroll this div directly — NOT the page */}
      <div
        ref={scrollContainerRef}
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
        className="p-6 space-y-8"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white/80" />
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl p-5 ${
              msg.role === 'user'
                ? 'bg-white text-black rounded-tr-sm shadow-lg shadow-white/5'
                : 'glass-panel rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-current/10 flex flex-wrap gap-2">
                  {msg.sources.map((source, idx) => (
                    <CitationChip key={idx} source={source} onClick={onSelectCitation} isUser={msg.role === 'user'} />
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white/80" />
            </div>
            <div className="glass-panel rounded-2xl rounded-tl-sm p-5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pt-2" style={{ flexShrink: 0 }}>
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question about the codebase..."
            className="w-full glass-input rounded-full pl-6 pr-14 py-4 text-sm text-white placeholder-white/40 shadow-xl"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2.5 bg-white text-black hover:bg-gray-200 rounded-full disabled:opacity-30 transition-all shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}