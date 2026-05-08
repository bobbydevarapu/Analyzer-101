# Assignment Integrity Analyzer (v2)

A professional, full-stack web application for detecting plagiarism and academic integrity violations in student assignments using machine learning and NLP. Built with modern tech stack: React + Vite (frontend) and FastAPI (backend).

## ✨ Features

✅ **Student Submission** - Upload assignments in multiple formats (PDF, DOCX, TXT, Images)  
✅ **AI-Powered Analysis** - SentenceTransformer embeddings + OCR for similarity detection  
✅ **Teacher Dashboard** - Real-time analysis, violation reports, email notifications  
✅ **Student Portal** - View results, assignment history, and violation details  
✅ **Email Notifications** - SendGrid integration for flagging students with violation details  
✅ **Admin Panel** - Manage users, assignments, and delete analysis data  
✅ **Mobile-Responsive UI** - Dark theme with Tailwind CSS, Framer Motion animations  
✅ **Report Export** - Download analysis in JSON/CSV formats  
✅ **Secure Authentication** - User sessions with token-based auth  

---

## 🛠 Tech Stack

**Backend:**
- **FastAPI** (async Python web framework)
- **Uvicorn** (ASGI server)
- **MongoDB** (NoSQL database)
- **SendGrid** (transactional email)
- **SentenceTransformers** (semantic similarity)
- **Pytesseract** (OCR for images)
- **Docker** (containerization)

**Frontend:**
- **React 18** (UI library)
- **Vite** (build tool, fast dev server)
- **TypeScript** (type-safe JavaScript)
- **Tailwind CSS** (utility-first styling)
- **Framer Motion** (animations)
- **React Router** (client-side routing)
- **Shadcn/ui** (accessible UI components)

**Deployment:**
- **Vercel** (frontend hosting, free tier)
- **Fly.io** (backend hosting, free tier)
- **Docker** (container support)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- MongoDB (local or Atlas cloud)
- SendGrid API key (optional, for email features)

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/bobbydevarapu/Assignment-Integrity-Analyzer.git
cd assignment_integrity_analyzer
git checkout upgrade-v2
```

2. **Backend Setup**
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Configure Environment**
```bash
# Create .env file in project root
cat > .env << EOF
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=your_email@gmail.com
MONGODB_URL=mongodb://localhost:27017/assignment_analyzer
ADMIN_USER=admin
ADMIN_PASS=secure_password_here
ADMIN_TOKEN=admin_token_here
TESSERACT_CMD=/usr/bin/tesseract
EOF
```

5. **Start MongoDB**
```bash
# Local MongoDB (if installed)
mongod

# OR use MongoDB Atlas
# Update MONGODB_URL in .env with your connection string
```

6. **Run Backend**
```bash
# From project root (with venv activated)
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
# Visit http://127.0.0.1:8000
```

7. **Run Frontend** (in new terminal)
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

---

## 🌐 Deployment

### Deploy Frontend to Vercel (Free)

1. Push code to GitHub (`upgrade-v2` branch)
2. Visit https://vercel.com and sign up
3. Click "New Project" → Select your GitHub repository
4. **Settings:**
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy" — Vercel auto-deploys on push
6. Get your frontend URL (e.g., `https://yourapp.vercel.app`)

### Deploy Backend to Fly.io (Free Tier)

1. Install `flyctl`: https://fly.io/docs/hands-on/install-flyctl/
2. Sign up at https://fly.io
3. From project root:

```bash
# Login
flyctl auth login

# Launch Fly app
flyctl launch --name assignment-integrity-analyzer --dockerfile ./Dockerfile --no-deploy

# Set environment secrets
flyctl secrets set \
  SENDGRID_API_KEY="your_sendgrid_key" \
  FROM_EMAIL="your_email@gmail.com" \
  MONGODB_URL="your_mongodb_url" \
  ADMIN_USER="admin" \
  ADMIN_PASS="secure_password" \
  TESSERACT_CMD="/usr/bin/tesseract"

# Deploy
flyctl deploy
```

4. Get your backend URL:
```bash
flyctl info
# URL will be: https://assignment-integrity-analyzer.fly.dev
```

5. **Update Frontend API URL**
   - Edit `frontend/src/lib/api.ts`
   - Update `BASE_URL` to your Fly.io backend URL
   - Redeploy frontend: `git push` → Vercel auto-deploys

---

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDGRID_API_KEY` | Yes | API key from SendGrid dashboard |
| `FROM_EMAIL` | Yes | Email address for sending notifications |
| `MONGODB_URL` | Yes | MongoDB connection string |
| `ADMIN_USER` | Yes | Admin panel username |
| `ADMIN_PASS` | Yes | Admin panel password |
| `ADMIN_TOKEN` | Yes | Admin authentication token |
| `TESSERACT_CMD` | No | Path to tesseract binary (default: `/usr/bin/tesseract`) |

---

## 📖 API Documentation

Once backend is running, visit:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

Key endpoints:
- `POST /teacher/analyze` - Analyze submitted assignments
- `GET /teacher/reports` - Fetch analysis reports
- `POST /teacher/send/{assignment_id}` - Send violation emails
- `GET /student/dashboard` - Student dashboard data
- `POST /student/login` - Student authentication

---

## 🔐 Security Notes

- **Rotate `SENDGRID_API_KEY`** regularly in production
- Never commit `.env` to version control
- Use strong passwords for `ADMIN_PASS`
- Enable HTTPS on production deployments
- Update `TESSERACT_CMD` path based on your system

---

## 🐛 Troubleshooting

**Frontend not loading on Vercel:**
- Ensure `upgrade-v2` branch is set in Vercel project settings
- Check build logs: Vercel Dashboard → Project → Deployments → View Logs

**Backend not connecting on Fly.io:**
- Verify environment secrets: `flyctl secrets list`
- Check logs: `flyctl logs`
- Ensure MongoDB URL is accessible from Fly.io VM

**Emails not sending:**
- Verify SendGrid API key is valid
- Check SendGrid dashboard for suppressed email addresses
- Ensure `FROM_EMAIL` is verified in SendGrid

**Model download timeout:**
- SentenceTransformer model (~100MB) downloads on first startup
- Increase Fly.io instance size if memory is insufficient
- Or use an embeddings API service to reduce overhead

---

## 📝 License

MIT License — see LICENSE file for details

---

## 👨‍💻 Contributing

Contributions welcome! Please:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📧 Support

For issues or questions:
- Create an issue on GitHub
- Contact: bobbydevarapu@gmail.com

---

**Version**: 2.0 (upgrade-v2)  
**Last Updated**: May 2026
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
