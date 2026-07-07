# InboxIQ

An AI-powered Gmail assistant that helps users manage their inbox more efficiently using intelligent email summaries, semantic search, and AI-generated replies.

![React](https://img.shields.io/badge/React-19-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![Python](https://img.shields.io/badge/Python-3.13-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

## Live Demo

**Frontend:** https://inboxiq-two.vercel.app

**Backend:** https://inboxiq-backend-0fnp.onrender.com

---

## Features

- Google OAuth 2.0 authentication
- Gmail integration
- AI-generated email replies
- AI daily inbox summary
- Natural language email search
- Star / Unstar emails
- Mark emails as read or unread
- Archive emails
- Smart rule management
- Responsive UI
- Secure session-based authentication

---

## Tech Stack

### Frontend

- React
- Vite
- CSS
- Fetch API

### Backend

- FastAPI
- Python
- Google Gmail API
- Google OAuth
- Gemini API

### Deployment

- Vercel
- Render

---



## Project Structure

```
InboxIQ
│
├── frontend
│   ├── src
│   ├── components
│   ├── utils
│   └── api.js
│
├── backend
│   ├── app
│   │   ├── routes
│   │   ├── services
│   │   ├── models
│   │   ├── ml
│   │   └── main.py
│   └── requirements.txt
│
└── README.md
```

---

## Getting Started

### Clone

```bash
git clone https://github.com/mayankisthis/inboxiq.git

cd inboxiq
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python run.py
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## Environment Variables

### Backend

Create a `.env`

```env
SECRET_KEY=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

FRONTEND_URL=http://localhost:5173

CORS_ORIGINS=http://localhost:5173

SESSION_SECURE=0

GEMINI_API_KEY=
```

---

### Frontend

```
VITE_API_URL=http://localhost:8000
```

---

## AI Features

### AI Daily Digest

Generates a concise summary of important emails received during the day.

### Smart Reply

Creates context-aware replies using Gemini.

### Natural Language Search

Search emails using queries like

- Emails from Amazon
- Unread emails from today
- Bills this month
- Interview emails

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/auth/google | Login |
| GET | /api/auth/me | Current User |
| POST | /api/auth/logout | Logout |
| GET | /api/emails/recent | Recent Emails |
| GET | /api/emails/digest | AI Daily Digest |
| POST | /api/emails/reply | Generate Reply |
| POST | /api/emails/send-reply | Send Reply |
| GET | /api/emails/search | Search Emails |
| POST | /api/emails/{id}/star | Toggle Star |
| POST | /api/emails/{id}/read | Toggle Read |
| POST | /api/emails/{id}/archive | Archive |

---

## Deployment

### Frontend

Hosted on Vercel.

### Backend

Hosted on Render.

Authentication is secured using Google OAuth and HTTPS-only session cookies.

---

## Future Improvements

- AI email categorization
- Calendar integration
- Attachment summarization
- Priority inbox
- Email scheduling
- Multiple Gmail account support
- Voice assistant

---

## Author

**Mayank Vaishnav**

GitHub: https://github.com/mayankisthis

LinkedIn: (Add your LinkedIn)

---

## License

MIT License