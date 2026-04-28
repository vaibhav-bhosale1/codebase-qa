# 🚀 CodeQA

<p align="center">
  <b>Your AI-Powered Senior Engineer for Codebases & PR Reviews</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/langchain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Qdrant-f90b47?style=for-the-badge&logo=qdrant&logoColor=white" />
</p>

---

## ✨ Overview

CodeQA is a modern, full-stack AI application that acts like a **senior software engineer** for your code.

It allows developers to:

* Understand entire repositories instantly
* Perform automated PR reviews
* Chat with codebases using AI
* Get precise, file-level citations

Built using an advanced **RAG (Retrieval-Augmented Generation)** pipeline powered by Groq, Cohere, and Qdrant.

---

## 🔥 Why This Project Stands Out

* ⚡ Real-world problem: Code review automation
* 🧠 Advanced RAG pipeline (not just API wrapper)
* 📂 Works on full repositories + PR diffs
* 🎯 File-level citation system (rare feature)
* 🚀 Production deployed (Vercel + Render)

---

## ✨ Features

### 🧠 Codebase Chat (RAG)

* Ingest any GitHub repo (URL / ZIP)
* Ask questions about architecture, bugs, logic

### 🔍 Auto PR Reviewer

* Paste PR link
* Get structured review:

  * Security issues
  * Code smells
  * Performance improvements

### 💬 PR Chat

* Ask contextual questions about PR diffs

### 🎯 Precise Citations

* Clickable references to:

  * Files
  * Line numbers
  * Code snippets

### ⚡ Blazing Fast

* Powered by Groq LLaMA 3.1 8B (instant inference)

---

## 🏗️ Architecture (High Level)

```text
GitHub Repo / PR
        ↓
   Data Ingestion
        ↓
   Chunking + Embedding (Cohere)
        ↓
   Vector Storage (Qdrant)
        ↓
   Retrieval (LangChain)
        ↓
   LLM (Groq)
        ↓
   Response + Citations
```

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS v4 (Glassmorphism UI)
* Axios
* React Syntax Highlighter
* Lucide React
* Deployment: Vercel

### Backend

* Python 3.11
* FastAPI
* LangChain (RAG pipeline)
* Groq (LLM inference)
* Cohere (Embeddings)
* Qdrant (Vector DB)
* Deployment: Render

---

## 🚀 Local Development Setup

### Prerequisites

* Node.js (v18+)
* Python (3.11)
* Groq API Key
* Cohere API Key
* Qdrant Cloud URL + API Key

---

### 1️⃣ Backend Setup

```bash
cd backend

python3.11 -m venv venv
source venv/bin/activate       # Mac/Linux
venv\Scripts\activate          # Windows

pip install -r requirements.txt

cp .env.example .env

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### backend/.env

```env
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key

LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_key
LANGCHAIN_PROJECT=codebase-qa
```

---

### 2️⃣ Frontend Setup

```bash
cd frontend

npm install

echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
```

---

## 🌍 Production Deployment

### 🚀 Backend (Render)

* Build Command:

```bash
pip install -r requirements.txt
```

* Start Command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

* Environment:

```env
PYTHON_VERSION=3.11.9
```

---

### 🌐 Frontend (Vercel)

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

⚠️ No trailing slash

---

## 📸 Screenshots (Add Yours)

> Add UI screenshots here for better impact

---

## 🚀 Future Improvements

* GitHub webhook integration for auto PR review
* Multi-repo support
* Team collaboration dashboard
* Code fix suggestions (auto patch generation)
* Fine-tuned LLM for code understanding

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**Vaibhav Bhosale**

* AI + Full Stack Developer
* MERN | FastAPI | RAG Systems
