import React from 'react';

export default function CitationChip({ source, onClick, isUser }) {
  const pathSegments = source.file.split('/');
  const shortName = pathSegments.slice(-2).join('/');

  // If inside a user bubble (white background), make chip dark.
  // If inside an assistant bubble (dark background), make chip translucent light.
  const chipStyle = isUser 
    ? 'bg-black/10 hover:bg-black/20 text-black border-black/20' 
    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10';

  return (
    <button 
      onClick={() => onClick(source)}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${chipStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isUser ? 'bg-black' : 'bg-white/80'}`}></span>
      <span className="truncate max-w-37.5" title={source.file}>{shortName}</span>
    </button>
  );
}