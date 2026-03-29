# IntelliTrade AI Stock Simulator

AI-powered stock trading simulator that combines live stock quotes, news sentiment analysis, AI chat guidance, and beginner/advanced analysis workflows.

## Features

- User authentication (register/login)
- Live stock quote tracking (Upstox)
- News sentiment analysis for stocks
- AI Stock Assistant chat (Groq API)
- Beginner and Advanced Analysis modes
- Advanced technical indicators (RSI, MACD, SMA, EMA, Bollinger Bands)
- Tutorials and guide video support
- Upstox settings and token testing UI

## Project Structure

```text
stock/
  backend/
    server.js                # Express backend (auth, AI chat, news proxy, instrument resolver)
    ml_api.py                # FastAPI ML inference server
    ml_predict.py
    ml_train.py
    ml_preprocess.py
    requirements-ml.txt
  frontend/
    src/
      App.jsx
      Home.jsx
      MainHome.jsx
      pages/
        Analysis.jsx
        AIGuide.jsx
        Settings.jsx
        StockResults.jsx
        StockSearch.jsx
    package.json
    vite.config.js
  data/
    stocks.json              # ML/stock dataset
    v.mp4                    # Guide video
  database/
    users.sql
```

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express + MongoDB (Mongoose)
- ML API: FastAPI + scikit-learn + pandas
- AI: Groq Chat API
- Market Data: Upstox APIs

## Prerequisites

Install these before running:

- Node.js 18+
- npm 9+
- Python 3.10+
- MongoDB (local or cloud URI)

## Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=4000
GROQ_API_KEY=your_groq_api_key
```

Optional frontend env (if needed):

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_UPSTOX_ACCESS_TOKEN=your_upstox_access_token
```

## Installation

### 1) Install backend dependencies

```bash
cd backend
npm install
```

### 2) Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 3) Install Python ML dependencies

```bash
cd ../backend
python -m pip install -r requirements-ml.txt
```

## Run the Project (End-to-End)

Open separate terminals.

### Terminal 1: Start Express backend

```bash
cd backend
node server.js
```

Expected:

- `Server running on port 4000`
- `MongoDB Connected`

### Terminal 2: Start frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in terminal (usually `http://localhost:5173`).

### Terminal 3 (ML): Start FastAPI ML service

If using virtual env on Windows:

```bash
cd backend
..\.venv\Scripts\python.exe -m uvicorn ml_api:app --host 127.0.0.1 --port 8000
```

Alternative (without venv path):

```bash
cd backend
python -m uvicorn ml_api:app --host 127.0.0.1 --port 8000
```

Health check:

- `http://127.0.0.1:8000/health`

## Key API Endpoints

### Express backend (`http://localhost:4000`)

- `POST /register` - Register user
- `POST /login` - Login user
- `GET /news/google-rss?symbol=RELIANCE` - News RSS proxy
- `POST /ai/stock-chat` - AI stock assistant chat
- `POST /api/ai/stock-chat` - Alias for AI chat route
- `GET /upstox/resolve-instrument?symbol=RELIANCE.BSE` - Resolve Upstox instrument key
- `GET /data/v.mp4` - Guide video static file

### ML API (`http://127.0.0.1:8000`)

- `GET /health`
- `GET /stocks?q=TATA&limit=20`
- `POST /predict`

Example `POST /predict` body:

```json
{
  "stock_name": "RELIANCE"
}
```

or

```json
{
  "open": 100,
  "high": 105,
  "low": 98,
  "close": 104,
  "volume": 1000000
}
```

## How to Use

1. Start backend and frontend.
2. Register a new account and log in.
3. Go to **Settings** and save your Upstox access token.
4. Use **Analysis**:
   - **Beginner**: normal stock + sentiment workflow
   - **Advanced**: beginner workflow + technical indicators + usage dropdown
5. Open **AI Guide** to ask stock-related questions.
6. Use the **Guide** button on Home to watch the `v.mp4` video.

## Troubleshooting

### Frontend `npm run dev` fails

- Delete and reinstall dependencies:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

(Windows PowerShell)

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run dev
```

### MongoDB connection error

- Verify `MONGODB_URI` in `backend/.env`
- Ensure your MongoDB server/cluster is reachable

### AI chat not responding

- Verify `GROQ_API_KEY` in `backend/.env`
- Restart backend after updating env variables

### Stock quote errors

- Ensure Upstox access token is valid in Settings
- Test connection from the Settings page

### Video not visible

- Ensure file exists at `data/v.mp4`
- Ensure backend is running (`/data` static path is served from backend)

### ML API import/model errors

- Reinstall Python dependencies in `backend/requirements-ml.txt`
- Ensure `data/stocks.json` exists

## Security Notes

- Never commit real API keys or secrets to public repositories
- Use `.env` files and keep them out of version control

## Build for Production

Frontend build:

```bash
cd frontend
npm run build
```

Preview build:

```bash
npm run preview
```

## License

This project is for educational and simulation purposes.
