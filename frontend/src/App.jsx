import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CodePreview from './components/CodePreview';
import PRReviewWindow from './components/PRReviewWindow';
import { getRepos, queryRepo, reviewPR, chatPR } from './components/api.js';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [appMode, setAppMode] = useState('chat');
  const [prReviews, setPrReviews] = useState(null);
  const [currentPrUrl, setCurrentPrUrl] = useState('');
  const [prMessages, setPrMessages] = useState([]);
  const [isPrChatLoading, setIsPrChatLoading] = useState(false);

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
    setAppMode('chat');
  };

  const handleSelectRepo = (repoId) => {
    setSelectedRepo(repoId);
    setMessages([]);
    setPreviewFile(null);
    setAppMode('chat');
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

  const handleReviewPR = async (url) => {
    setAppMode('pr');
    setCurrentPrUrl(url);
    setIsLoading(true);
    setPrMessages([]);
    
    try {
      const reviews = await reviewPR(url);
      setPrReviews(reviews);
    } catch (error) {
      alert("Failed to review PR: " + (error.response?.data?.detail || error.message));
      setPrReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePRSendMessage = async (question) => {
    const newUserMsg = { id: Date.now(), role: 'user', content: question };
    setPrMessages((prev) => [...prev, newUserMsg]);
    setIsPrChatLoading(true);

    try {
      const history = prMessages.map(m => ({ role: m.role, content: m.content }));
      const answer = await chatPR(currentPrUrl, question, history);
      
      const newBotMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: answer
      };
      setPrMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      setPrMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || error.message}`
      }]);
    } finally {
      setIsPrChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-gray-100 overflow-hidden font-sans relative selection:bg-white/30">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[100px] pointer-events-none" />

      {/* Added overflow-hidden here — this was the real cause of the layout shift */}
      <div className="flex w-full h-full z-10 backdrop-blur-[2px] overflow-hidden">
        <Sidebar 
          repos={repos} 
          selectedRepo={selectedRepo} 
          onSelectRepo={handleSelectRepo}
          onRepoUploaded={handleRepoUploaded}
          onReviewPR={handleReviewPR}
          appMode={appMode}
          setAppMode={setAppMode}
        />
        
        {appMode === 'chat' ? (
          <>
            <ChatWindow 
              messages={messages}
              isLoading={isLoading}
              selectedRepo={selectedRepo}
              onSendMessage={handleSendMessage}
              onSelectCitation={setPreviewFile}
            />
            <CodePreview previewFile={previewFile} />
          </>
        ) : (
          <PRReviewWindow 
            prReviews={prReviews} 
            isLoading={isLoading} 
            prUrl={currentPrUrl} 
            messages={prMessages}
            isChatLoading={isPrChatLoading}
            onSendMessage={handlePRSendMessage}
          />
        )}
      </div>
    </div>
  );
}