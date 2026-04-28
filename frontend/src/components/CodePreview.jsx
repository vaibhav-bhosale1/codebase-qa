import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode2 } from 'lucide-react';

export default function CodePreview({ previewFile }) {
  if (!previewFile) {
    return (
      <div className="w-100 glass-panel border-y-0 border-r-0 flex items-center justify-center text-white/30 p-6 text-center z-20">
        <div>
          <FileCode2 className="w-12 h-12 mx-auto mb-4 opacity-40 stroke-[1.5]" />
          <p className="text-sm font-medium">Click a citation to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 glass-panel border-y-0 border-r-0 flex flex-col h-full overflow-hidden z-20">
      <div className="bg-black/40 px-4 py-3 flex items-center justify-between border-b border-white/10">
        <span className="text-white/80 text-xs truncate font-mono tracking-tight" title={previewFile.file}>
          {previewFile.file}
        </span>
        <span className="text-[10px] uppercase tracking-wider bg-white/10 text-white/60 px-2 py-0.5 rounded border border-white/5">
          {previewFile.language}
        </span>
      </div>
      
      <div className="flex-1 overflow-auto text-[13px] bg-black/60 custom-scrollbar">
        <SyntaxHighlighter
          language={previewFile.language}
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          customStyle={{ margin: 0, padding: '1.5rem 1rem', background: 'transparent' }}
          lineProps={(lineNumber) => {
            const lineText = previewFile.snippet.split('\n')[lineNumber - 1] || '';
            const isHighlighted = previewFile.snippet && previewFile.snippet.includes(lineText.trim()) && lineText.trim() !== '';
            
            return {
              style: {
                display: 'block',
                backgroundColor: isHighlighted ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                borderLeft: isHighlighted ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
              }
            };
          }}
        >
          {previewFile.snippet}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}