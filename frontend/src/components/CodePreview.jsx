import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode2 } from 'lucide-react';

export default function CodePreview({ previewFile }) {
  if (!previewFile) {
    return (
      <div className="w-96 bg-gray-900 border-l border-gray-800 flex items-center justify-center text-gray-500 p-6 text-center">
        <div>
          <FileCode2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Click a citation to preview code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-[#1e1e1e] border-l border-gray-800 flex flex-col h-full overflow-hidden">
      <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-black text-sm">
        <span className="text-gray-300 truncate font-mono" title={previewFile.file}>
          {previewFile.file}
        </span>
        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
          {previewFile.language}
        </span>
      </div>
      
      <div className="flex-1 overflow-auto text-sm">
        <SyntaxHighlighter
          language={previewFile.language}
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
          lineProps={(lineNumber) => {
            // Rough highlight matching based on the snippet text existing in the line
            // In a real app, returning exact line numbers from the backend is safer
            const lineText = previewFile.snippet.split('\n')[lineNumber - 1] || '';
            const isHighlighted = previewFile.snippet && previewFile.snippet.includes(lineText.trim()) && lineText.trim() !== '';
            
            return {
              style: {
                display: 'block',
                backgroundColor: isHighlighted ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }
            };
          }}
        >
          {/* We are showing the snippet here. If you had an endpoint to fetch full file text, it would go here. */}
          {previewFile.snippet}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}