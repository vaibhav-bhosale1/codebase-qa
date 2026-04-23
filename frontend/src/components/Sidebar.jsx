import React, { useRef, useState } from 'react';
import { Upload, Database, Loader2 } from 'lucide-react';
import { uploadZipRepo } from './api';

export default function Sidebar({ repos, selectedRepo, onSelectRepo, onRepoUploaded }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.zip')) {
      alert("Please upload a valid .zip file.");
      return;
    }

    setIsUploading(true);
    setUploadStatus(`Indexing ${file.name}...`);
    
    try {
      const result = await uploadZipRepo(file);
      setUploadStatus(`Indexed ${result.chunks_created} chunks!`);
      onRepoUploaded(result.repo_id);
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      setUploadStatus('Upload failed.');
      alert(error.response?.data?.detail || error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-6">
          <Database className="text-blue-500" />
          CodeQA
        </h1>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? 'Indexing...' : 'Upload Repo (.zip)'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".zip" 
          className="hidden" 
          onChange={handleFileUpload}
        />
        
        {uploadStatus && (
          <p className="text-xs text-center mt-2 text-green-400">{uploadStatus}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
          Indexed Repositories
        </div>
        
        {repos.length === 0 ? (
          <p className="text-sm text-gray-500 px-3 italic">No repos indexed yet.</p>
        ) : (
          <div className="space-y-1">
            {repos.map(repo => (
              <button
                key={repo}
                onClick={() => onSelectRepo(repo)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                  selectedRepo === repo 
                    ? 'bg-gray-800 text-blue-400 font-medium' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {repo}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}