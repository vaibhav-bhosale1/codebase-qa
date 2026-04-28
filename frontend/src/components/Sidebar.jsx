import React, { useRef, useState } from 'react';
import { Upload, Database, Loader2, GitPullRequest, Code2, GitBranchPlus } from 'lucide-react';
import { uploadZipRepo, uploadGithubRepo } from './api';

export default function Sidebar({ repos, selectedRepo, onSelectRepo, onRepoUploaded, onReviewPR, appMode, setAppMode }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Inputs
  const [githubUrl, setGithubUrl] = useState('');
  
  const [prUrlInput, setPrUrlInput] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.zip')) {
      alert("Please upload a valid .zip file.");
      return;
    }
    await processIngestion(() => uploadZipRepo(file), file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGithubIngest = async () => {
    if (!githubUrl.startsWith("https://github.com/")) {
      alert("Please enter a valid GitHub repository URL.");
      return;
    }
    await processIngestion(() => uploadGithubRepo(githubUrl), 'GitHub Repo');
    setGithubUrl('');
  };

  const processIngestion = async (apiCall, label) => {
    setIsUploading(true);
    setUploadStatus(`Indexing ${label}...`);
    try {
      const result = await apiCall();
      setUploadStatus(`Indexed successfully!`);
      onRepoUploaded(result.repo_id);
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      setUploadStatus('Ingestion failed.');
      alert(error.response?.data?.detail || error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-72 glass-panel flex flex-col h-full z-20 shrink-0">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3 mb-8">
          <Database className="w-6 h-6 text-white/80" />
          CodeQA
        </h1>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-black/40 rounded-lg p-1 mb-6 border border-white/10 backdrop-blur-md">
          <button 
            onClick={() => setAppMode('chat')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${appMode === 'chat' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/80'}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Repo Chat
          </button>
          <button 
            onClick={() => setAppMode('pr')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${appMode === 'pr' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/80'}`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            PR Review
          </button>
        </div>

        {/* Dynamic Panel Content based on Mode */}
        {appMode === 'chat' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <input 
                type="text"
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={isUploading}
                className="w-full glass-input rounded-md px-3 py-2 text-sm text-white placeholder-white/30"
              />
              <button 
                onClick={handleGithubIngest}
                disabled={isUploading || !githubUrl}
                className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all text-xs font-medium border border-white/10"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranchPlus className="w-3.5 h-3.5" />}
                Ingest GitHub URL
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-white/10"></div>
              <span className="shrink-0 mx-4 text-white/30 text-xs">OR</span>
              <div className="grow border-t border-white/10"></div>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all text-xs font-semibold"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Zip Archive
            </button>
            <input type="file" ref={fileInputRef} accept=".zip" className="hidden" onChange={handleFileUpload} />
            
            {uploadStatus && <p className="text-xs text-center text-white/70 animate-pulse">{uploadStatus}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <input 
              type="text"
              placeholder="Paste PR URL..."
              value={prUrlInput}
              onChange={(e) => setPrUrlInput(e.target.value)}
              className="w-full glass-input rounded-md px-3 py-2 text-sm text-white placeholder-white/30"
            />
            <button 
              onClick={() => { if(prUrlInput) onReviewPR(prUrlInput); }}
              className="w-full bg-white text-black hover:bg-gray-200 py-2 px-4 rounded-md transition-all text-xs font-semibold flex justify-center items-center gap-2"
            >
              <GitPullRequest className="w-3.5 h-3.5"/> Analyze PR
            </button>
          </div>
        )}
      </div>

      {appMode === 'chat' && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 px-2">
            Indexed Repositories
          </div>
          
          {repos.length === 0 ? (
            <p className="text-xs text-white/30 px-2 italic">No repos indexed yet.</p>
          ) : (
            <div className="space-y-1">
              {repos.map(repo => (
                <button
                  key={repo}
                  onClick={() => onSelectRepo(repo)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-all duration-200 ${
                    selectedRepo === repo 
                      ? 'bg-white/10 text-white font-medium border border-white/10' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90 border border-transparent'
                  }`}
                >
                  {repo}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}