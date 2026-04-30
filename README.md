# Assignment Integrity Analyzer

A professional web application for detecting plagiarism and academic integrity violations in student assignments using machine learning and NLP.

## Features

✅ **Student Submission** - Upload assignments in multiple formats (PDF, DOCX, TXT,IMAGES)  
✅ **AI-Powered Analysis** - TF-IDF + SentenceTransformer embeddings for similarity detection  
✅ **Teacher Dashboard** - Analyze submissions and review similarity matrix  
✅ **Email Notifications** - SendGrid integration for flagging students  
✅ **Admin Panel** - Manage and delete assignment data  
✅ **Responsive UI** - Mobile-friendly dark theme with professional design  
✅ **Report Download** - Export analysis in JSON/CSV formats 

---

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- Uvicorn (ASGI server)
- MongoDB (NoSQL database)
- SendGrid (email service)
- scikit-learn & SentenceTransformer (ML/NLP)

**Frontend:**
- HTML/CSS/JavaScript (Vanilla)
- Responsive Design (Mobile-first)
- Toast Notifications
- Report Export (JSON/CSV)

**Deployment:**
- Docker support
- Railway/Render/Heroku compatible
- Environment-based configuration

---

## Local Setup

### Prerequisites
- Python 3.8+
- MongoDB (local or Atlas)
- SendGrid API key

### Installation

1. **Clone & Install Dependencies**
```bash
cd assignment_integrity_analyzer
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB**
```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Set MONGODB_URL in .env
```

4. **Run Backend**
```bash
python -m uvicorn backend.main:app --reload
# Server runs on http://127.0.0.1:8000
```

5. **Serve Frontend**
```bash
# Option A: Simple HTTP server
python -m http.server 5500 --directory frontend

# Option B: Use Live Server extension in VS Code
# Open frontend/index.html and use Live Server
```

6. **Access App**
- Open `http://127.0.0.1:5500/frontend/`

---

## Environment Variables

Create a `.env` file with:

```env
# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Admin Authentication
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
ADMIN_TOKEN=your_secure_token

# MongoDB Connection (local or cloud)
MONGODB_URL=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/assignment_analyzer

# Optional: SMTP Fallback (if SendGrid fails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## API Endpoints

### Student
- `POST /submit` - Submit assignment
  - Form: `assignment_id`, `roll`, `email`, `file`
  - Returns: `{"message": "Submission successful"}`

### Teacher
- `POST /analyze/{assignment_id}` - Analyze submissions
  - Returns: Analysis report with similarity matrix & flagged pairs
  - Requires: ≥2 submissions

### Email
- `POST /send/{assignment_id}` - Send flagged emails to students
  - Returns: `{"message": "...", "sent_count": N}`
  - Emails automatically generated with score & status

### Admin
- `POST /admin/login` - Authenticate
  - Form: `username`, `password`
  - Returns: `{"token": "bearer_token"}`

- `DELETE /delete/{assignment_id}` - Delete assignment data
  - Header: `Authorization: Bearer {token}`
  - Returns: Delete count statistics

---

## Frontend Architecture

| Section | Role | Features |
|---------|------|----------|
| **Student** | Submit assignments | File upload, validation, success feedback |
| **Teacher** | Analyze & email | Run analysis, view report, download, send emails |
| **Admin** | Manage data | Login, delete assignments, manage users |

**UI Components:**
- Toast Notifications (top-center popups)
- Similarity Matrix (heatmap table)
- Flagged Pairs Table (actionable results)
- Download Buttons (JSON/CSV export)
- Responsive Grid Layouts

---

## File Structure

```
assignment_integrity_analyzer/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── database.py          # MongoDB connection
│   ├── core/
│   │   ├── similarity.py    # TF-IDF + embeddings
│   │   └── decision.py      # Classification logic
│   ├── utils/
│   │   ├── file_utils.py    # Document parsing
│   │   └── email_utils.py   # SendGrid wrapper
│   ├── logs/                # Email & debug logs
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── index.html           # Main UI
│   ├── script.js            # Business logic
│   ├── styles.css           # Styling
│   └── assets/              # Images/icons
├── scripts/                 # Utility scripts
├── Dockerfile               # Docker build
├── render.yaml              # Render deployment config
└── requirements.txt         # Python dependencies
```

---

## Deployment

This project is set up for Render deployment with Docker.

**Quick Start (Render):**
1. Push the repo to GitHub
2. Open Render and create a new Blueprint from the repo
3. Add environment variables in the Render dashboard
4. Deploy ✅

---

## Common Issues & Solutions

### Email Not Sending
- ✅ Check `SENDGRID_API_KEY` is valid
- ✅ Verify `FROM_EMAIL` is verified in SendGrid
- ✅ Check `backend/logs/email.log` for errors

### Analysis Shows "Need at least 2 submissions"
- ✅ Must have 2+ submissions before analyzing
- ✅ Verify submissions are in database: `db.submissions.find()`

### Frontend Doesn't Connect to Backend
- ✅ Verify `BASE_URL` in `frontend/script.js` points to your backend
- ✅ Check CORS is enabled in FastAPI (it is by default)
- ✅ Ensure backend is running on correct port

### MongoDB Connection Fails
- ✅ Verify connection string in `.env`
- ✅ For MongoDB Atlas: whitelist your IP
- ✅ Check network connectivity

---

## Performance & Scalability

- **Model Caching**: SentenceTransformer lazy-loads on first use
- **Async Processing**: FastAPI handles concurrent requests efficiently
- **Database Indexing**: Add index on `assignment_id` for faster queries

**For high-traffic deployments:**
- Add Redis caching for analysis results
- Use job queue (Celery) for batch email sends
- Implement rate limiting
- Monitor with Sentry/New Relic

---

## Security Considerations

- ✅ Environment variables for secrets (never commit `.env`)
- ✅ Bearer token authentication for admin operations
- ✅ Input validation on all endpoints
- ✅ CORS configured for secure cross-origin requests
- ✅ File upload validation (prevents malicious files)
- ✅ MongoDB injection protection via pymongo

**Production Hardening:**
- Use HTTPS (hosting providers auto-enable)
- Add rate limiting
- Implement API key rotation
- Use secrets manager instead of .env in production
- Enable database backups
- Monitor logs for suspicious activity

---

## Logging & Monitoring

**Backend Logs:**
```bash
# Email logs
tail -f backend/logs/email.log

# Application logs (in terminal)
# Watch for errors and request details
```

---

## Testing

Run test email send:
```bash
python scripts/create_test_results.py CSE-01 85 "Suspected"
```

Then visit `/send/CSE-01` to trigger emails.

---

## Future Enhancements

- [ ] Web interface for admin management
- [ ] Advanced ML models (neural networks)
- [ ] Plagiarism source detection (external datasets)
- [ ] Batch analysis for multiple assignments
- [ ] Dashboard analytics & reports
- [ ] Student appeal workflow
- [ ] Multi-language support

---

## License

MIT License - Free to use and modify

---

## Support

For issues or questions:
1. Review logs in `backend/logs/`
2. Verify `.env` configuration locally or Render variables in production
3. Test endpoints with Postman/curl

---

## Author

Assignment Integrity Analyzer v1.0  
Built with ❤️ for academic integrity
"# assignment_integrity_analyzer" 
