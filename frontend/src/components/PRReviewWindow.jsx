import React, { useState, useRef, useEffect } from 'react';
import { GitPullRequest, AlertTriangle, CheckCircle, Info, Send, Bot, User } from 'lucide-react';

export default function PRReviewWindow({ prReviews, isLoading, prUrl, messages, isChatLoading, onSendMessage }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading || !prUrl) return;
    onSendMessage(input);
    setInput('');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/50">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
        <p className="text-sm tracking-wide">Analyzing Pull Request diff...</p>
      </div>
    );
  }

  if (!prReviews && !prUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8">
        <GitPullRequest className="w-16 h-16 mb-6 opacity-20 stroke-1" />
        <h2 className="text-2xl font-light text-white/80">Auto PR Reviewer</h2>
        <p className="mt-2 text-sm">Paste a GitHub PR link in the sidebar to initiate an AI code review.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* TOP SECTION: Static Review Findings (Scrollable) */}
      <div className="h-[45%] overflow-y-auto border-b border-white/10 p-8 scroll-smooth">
        <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2 sticky top-0 bg-black/80 backdrop-blur-md py-2 z-10 border-b border-white/5">
          <GitPullRequest className="w-5 h-5 text-white/60" />
          Review Findings
        </h2>
        
        {prReviews && prReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-white p-8">
            <CheckCircle className="w-12 h-12 mb-4 text-white/80 stroke-[1.5]" />
            <h2 className="text-lg font-medium">LGTM! (Looks Good To Me)</h2>
            <p className="text-white/50 text-sm mt-1">No major security, performance, or complexity issues found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prReviews?.map((review, idx) => {
              // Monochrome severity styling
              const isHigh = review.severity === 'High';
              const isMed = review.severity === 'Medium';
              
              const borderClass = isHigh ? 'border-white' : isMed ? 'border-white/40' : 'border-white/10';
              const textClass = isHigh ? 'bg-white text-black' : 'bg-white/10 text-white';

              return (
                <div key={idx} className={`glass-panel border rounded-xl p-5 ${borderClass}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-[13px] text-white/70 break-all">{review.file_path}</span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 ${textClass}`}>
                      {isHigh ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3"/>}
                      {review.severity}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{review.suggestion}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: PR Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 && (
             <div className="text-center text-white/40 mt-10">
               <p className="text-sm">Have questions about this PR? Ask them here.</p>
             </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white/80" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl p-5 ${
                msg.role === 'user' 
                  ? 'bg-white text-black rounded-tr-sm shadow-lg' 
                  : 'glass-panel rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isChatLoading && (
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
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Field */}
        <div className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isChatLoading}
              placeholder="Ask a question about this Pull Request..."
              className="w-full glass-input rounded-full pl-6 pr-14 py-4 text-sm text-white placeholder-white/40 shadow-xl"
            />
            <button
              type="submit"
              disabled={isChatLoading || !input.trim()}
              className="absolute right-2 p-2.5 bg-white text-black hover:bg-gray-200 rounded-full disabled:opacity-30 transition-all shadow-md"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}