import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000'
});

export const getRepos = async () => {
  const response = await api.get('/repos');
  return response.data.repos;
};

export const uploadZipRepo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/ingest/zip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const uploadGithubRepo = async (url) => {
  const response = await api.post('/ingest/github', { url });
  return response.data;
};

export const queryRepo = async (question, repoId) => {
  const response = await api.post('/query', {
    question: question,
    repo_id: repoId
  });
  return response.data;
};

export const reviewPR = async (prUrl) => {
  const response = await api.post('/review/pr', { pr_url: prUrl });
  return response.data.review_comments;
};

export const chatPR = async (prUrl, question, history = []) => {
  const response = await api.post('/review/pr/chat', {
    pr_url: prUrl,
    question: question,
    history: history
  });
  return response.data.answer;
};