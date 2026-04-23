import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CodePreview from './components/CodePreview';
import { getRepos, queryRepo } from './components/api.js';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const fetchedRepos = await getRepos();
      setRepos(fetchedRepos);
    } catch (error) {
      console.error("Failed to fetch repos:", error);
    }
  };

  const handleRepoUploaded = (newRepoId) => {
    fetchRepos();
    setSelectedRepo(newRepoId);
    setMessages([]);
    setPreviewFile(null);
  };

  const handleSelectRepo = (repoId) => {
    setSelectedRepo(repoId);
    setMessages([]);
    setPreviewFile(null);
  };

  const handleSendMessage = async (question) => {
    const newUserMsg = { id: Date.now(), role: 'user', content: question };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await queryRepo(question, selectedRepo);
      const newBotMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
        sources: response.sources
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || error.message}`,
        sources: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 font-sans text-gray-100 overflow-hidden">
      <Sidebar 
        repos={repos} 
        selectedRepo={selectedRepo} 
        onSelectRepo={handleSelectRepo}
        onRepoUploaded={handleRepoUploaded}
      />
      <ChatWindow 
        messages={messages}
        isLoading={isLoading}
        selectedRepo={selectedRepo}
        onSendMessage={handleSendMessage}
        onSelectCitation={setPreviewFile}
      />
      <CodePreview 
        previewFile={previewFile} 
      />
    </div>
  );
}