import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import CitationChip from './CitationChip';

export default function ChatWindow({ messages, isLoading, selectedRepo, onSendMessage, onSelectCitation }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedRepo) return;
    onSendMessage(input);
    setInput('');
  };

  if (!selectedRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-gray-500 p-8">
        <Bot className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-medium text-gray-400">Welcome to CodeQA</h2>
        <p className="mt-2">Select a repository from the sidebar or upload a new one to begin.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 h-full relative">
      <div className="bg-gray-900 border-b border-gray-800 p-4 text-center">
        <span className="text-sm font-medium text-gray-400">
          Querying: <span className="text-blue-400">{selectedRepo}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700 flex flex-wrap gap-2">
                  {msg.sources.map((source, idx) => (
                    <CitationChip 
                      key={idx} 
                      source={source} 
                      onClick={onSelectCitation} 
                    />
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 rounded-bl-none flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question about the codebase..."
            className="w-full bg-gray-900 border border-gray-700 rounded-full pl-5 pr-12 py-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}