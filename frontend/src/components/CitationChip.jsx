import React from 'react';

const LANGUAGE_COLORS = {
  python: 'bg-blue-500',
  javascript: 'bg-yellow-400',
  typescript: 'bg-blue-400',
  java: 'bg-orange-500',
  default: 'bg-gray-400'
};

export default function CitationChip({ source, onClick }) {
  const colorClass = LANGUAGE_COLORS[source.language?.toLowerCase()] || LANGUAGE_COLORS.default;
  
  // Truncate filename to last two segments for cleaner UI
  const pathSegments = source.file.split('/');
  const shortName = pathSegments.slice(-2).join('/');

  return (
    <button 
      onClick={() => onClick(source)}
      className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 border border-gray-700 transition-colors cursor-pointer"
    >
      <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
      <span className="truncate max-w-[150px]" title={source.file}>{shortName}</span>
    </button>
  );
}