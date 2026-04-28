import os
import json
import httpx
from langchain_groq import ChatGroq

REVIEW_SYSTEM_PROMPT = """You are an expert senior software engineer reviewing a pull request.
Analyze the provided code diff. Look for:
1. Security vulnerabilities
2. Performance issues
3. Code smells or anti-patterns
4. Unnecessary cyclomatic complexity

Respond ONLY with a valid JSON array of objects. Do not include markdown formatting, backticks, or explanations outside the JSON.
Format:
[
  {
    "file_path": "path/to/file",
    "severity": "High|Medium|Low",
    "suggestion": "Detailed explanation of the issue and how to fix it."
  }
]
If there are no issues, return an empty array: []
"""

async def fetch_pr_diff(pr_url: str) -> str:
    """Extracts the API URL from the standard GitHub URL and fetches the diff."""
    parts = pr_url.rstrip("/").split("/")
    if "pull" not in parts:
        raise ValueError("Invalid PR URL format.")
    
    owner, repo, pr_number = parts[-4], parts[-3], parts[-1]
    api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
    
    # Headers to specifically request the raw diff format
    headers = {"Accept": "application/vnd.github.v3.diff"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url, headers=headers)
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch PR diff. GitHub returned: {response.status_code}")
        return response.text

async def generate_pr_review(pr_url: str) -> list:
    """Fetches the diff and sends it to Groq for a structured review."""
    diff_text = await fetch_pr_diff(pr_url)
    
    if not diff_text.strip():
        return []

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.0,
        groq_api_key=os.environ.get("GROQ_API_KEY")
    )
    
    messages = [
        ("system", REVIEW_SYSTEM_PROMPT),
        ("human", f"Review this diff:\n\n{diff_text}")
    ]
    
    try:
        response = llm.invoke(messages)
        # Parse the JSON string returned by Groq into a Python list
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"Failed to parse LLM review: {e}")
        return []

async def chat_about_pr(pr_url: str, question: str, history: list) -> str:
    """Answers user questions based on the PR diff context."""
    diff_text = await fetch_pr_diff(pr_url)
    
    if not diff_text.strip():
        return "I couldn't find any code changes in this PR to answer your question."

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2, # slightly higher temp for conversational replies
        groq_api_key=os.environ.get("GROQ_API_KEY")
    )
    
    # System prompt injects the PR diff
    messages = [
        ("system", f"You are an expert code assistant helping a developer understand a Pull Request. Use the provided PR diff to answer their questions accurately. Be concise and technical.\n\nPR Diff:\n{diff_text}")
    ]
    
    # Append chat history
    for msg in history:
        messages.append((msg["role"], msg["content"]))
        
    # Append current question
    messages.append(("human", question))
    
    try:
        response = llm.invoke(messages)
        return response.content
    except Exception as e:
        print(f"Failed to generate chat response: {e}")
        return "Sorry, I encountered an error while processing your question."