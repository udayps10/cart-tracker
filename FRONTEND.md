# Commerce Copilot web interface

A local HTML, CSS and JavaScript frontend with a small Python server. No Streamlit or frontend build tools required.

From the project directory in PowerShell:

```powershell
.\.venv\Scripts\python.exe server.py
```

Open http://localhost:8000. Keep the terminal running; Ctrl+C stops the app.

The server reuses `products.db` and the `commerce_products` collection in `chroma_db`, created by the notebook. It uses existing `python-dotenv`, `langchain-google-genai`, and `langchain-chroma` packages. Google generation requests use Python's standard library. The Google AI Studio key stays in `.env` on the server; either `GEMINI_API_KEY` or the original `OPENAI_API_KEY` variable is supported.

Choose a category and maximum budget, then ask a question. Sidebar values enforce exact constraints; numbers mentioned only in chat do not change those controls. SQL excludes out-of-stock and over-budget products before semantic retrieval. Cards show database facts, ranked by relevance; Gemini explains the retrieved evidence. Follow-ups remember up to three exchanges per browser tab. New conversation clears history; refreshing also clears history. Products and prices are fictional samples, not live offers. Generated explanations can still contain errors.

The browser displays a recoverable error if Google is unavailable and keeps the question for retry. No secrets, database files or notebooks are publicly served. This is a localhost development app, not a production deployment.

## Check

```powershell
.\.venv\Scripts\python.exe -m unittest test_frontend.py
```

These local tests verify filtering and mocked retrieval/answer wiring without API calls. For a live check, ask for a college laptop under ₹60,000 and then ask which is easier to carry. Also test budget ₹0 and Clear conversation.
