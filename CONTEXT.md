# Gmail Summarizer — Complete Coding Agent Plan

## 1. Project Overview

Build a **mobile-first personal email intelligence web application** that connects to a user's Gmail account, reads and analyzes emails using AI, and converts the inbox into a structured dashboard of important information.

The application should not behave like another Gmail client.

The primary purpose is to answer:

> **"What important things are happening in my life based on my emails?"**

The system should automatically identify things such as:

* Job applications
* Recruiter/HR emails
* Interview invitations
* Interview dates
* Job opportunities
* Job application status
* Travel bookings
* Flights
* Hotels
* Upcoming trips
* Meetings
* Appointments
* Deadlines
* Documents requested
* Tasks requiring action
* Important personal emails

Instead of requiring the user to manually read hundreds of emails, the application should present the important information in a clean dashboard.

---

# 2. Repository

GitHub repository:

```text
https://github.com/PrateekDahiya/gmailSummarizer.git
```

The repository should be treated as the main project repository.

The current project is intended to start as a clean implementation.

Do not create a separate repository.

---

# 3. Technology Stack

## Frontend

Use only:

* HTML
* CSS
* Vanilla JavaScript

Do **not** use:

* React
* Vue
* Angular
* Next.js
* Tailwind
* Bootstrap

The frontend should be responsive and mobile-first.

Desktop should also work, but mobile is the primary design target.

---

## Backend

Use:

* Node.js
* Express.js
* JavaScript

Do not use TypeScript.

---

## Database

Use:

* MySQL
* Aiven MySQL

Node.js should connect using `mysql2`.

Do not use a JDBC connection string directly.

The JDBC-style database URL currently available should be converted into normal MySQL connection properties:

```text
host
port
database
username
password
ssl
```

---

## Authentication

Use:

* Google OAuth 2.0
* Gmail API
* JWT/session authentication

The application must never expose Google refresh tokens to the frontend.

---

## AI

Use:

* Groq API
* Configurable Groq model through environment variables

The current model is:

```text
llama-3.1-8b-instant
```

The AI response should preferably be structured JSON.

---

## Deployment

Target:

```text
Render
```

Frontend:

```text
https://emailsummarizer-ppeh.onrender.com
```

Backend can either be served by the same Express application or deployed separately if required.

Prefer a **single Express deployment serving the static frontend** initially because it keeps deployment simple.

---

# 4. Environment Variables

The application requires:

```env
DB_HOST=
DB_PORT=
DB_NAME=emailSummarizer
DB_USERNAME=
DB_PASSWORD=

FRONTEND_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

GROQ_API_KEY=
GROQ_MODEL=

JWT_SECRET=
```

Never hardcode any secret.

Never expose these variables to frontend JavaScript.

Never commit `.env`.

Create:

```text
.env.example
```

containing variable names but no real credentials.

### Security requirement

The credentials previously supplied to the project should be considered compromised because they were exposed during development.

Rotate:

* Database password
* Google client secret
* Groq API key
* JWT secret

before production deployment.

---

# 5. High-Level Architecture

```text
                     ┌─────────────────┐
                     │     Browser     │
                     │ HTML/CSS/JS     │
                     └────────┬────────┘
                              │
                              │ REST API
                              ▼
                     ┌─────────────────┐
                     │    Express.js   │
                     │     Backend     │
                     └───────┬─┬───────┘
                             │ │
              ┌──────────────┘ └──────────────┐
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │    MySQL      │               │   Gmail API   │
      │    Aiven      │               │ Google OAuth  │
      └───────────────┘               └───────┬───────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │    Groq     │
                                       │     AI      │
                                       └─────────────┘
```

---

# 6. Core Data Flow

The central pipeline should be:

```text
User connects Gmail
        ↓
Google OAuth
        ↓
Store Gmail refresh token securely
        ↓
Fetch Gmail messages
        ↓
Parse email
        ↓
Clean email content
        ↓
Classify email
        ↓
Extract entities
        ↓
Calculate importance
        ↓
Store structured information
        ↓
Dashboard
```

---

# 7. Project Structure

Use approximately this structure:

```text
gmailSummarizer/
│
├── backend/
│   ├── src/
│   │   │
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── google.js
│   │   │   └── groq.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── emailController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── jobController.js
│   │   │   ├── tripController.js
│   │   │   ├── taskController.js
│   │   │   └── aiController.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── emailRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── tripRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   └── aiRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── gmailService.js
│   │   │   ├── emailParser.js
│   │   │   ├── emailCleaner.js
│   │   │   ├── aiService.js
│   │   │   ├── emailProcessor.js
│   │   │   ├── jobService.js
│   │   │   ├── tripService.js
│   │   │   └── syncService.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── logger.js
│   │   │   └── validators.js
│   │   │
│   │   └── app.js
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── jobs.html
│   ├── trips.html
│   ├── emails.html
│   ├── settings.html
│   │
│   ├── css/
│   │   ├── common.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   └── pages.css
│   │
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── jobs.js
│       ├── trips.js
│       ├── emails.js
│       └── settings.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── .gitignore
├── README.md
└── package.json
```

---

# 8. Database Design

## users

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

---

## gmail_accounts

```sql
CREATE TABLE gmail_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    gmail_email VARCHAR(255) NOT NULL,
    refresh_token TEXT NOT NULL,
    history_id VARCHAR(255),
    last_synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## emails

```sql
CREATE TABLE emails (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL,

    gmail_message_id VARCHAR(255) NOT NULL,
    gmail_thread_id VARCHAR(255),

    sender_email VARCHAR(500),
    sender_name VARCHAR(500),

    subject TEXT,
    snippet TEXT,
    body TEXT,

    received_at DATETIME,

    is_processed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_gmail_message (
        user_id,
        gmail_message_id
    ),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## email_analysis

```sql
CREATE TABLE email_analysis (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    email_id BIGINT NOT NULL,

    category VARCHAR(50),
    importance_score INT,

    summary TEXT,

    action_required BOOLEAN DEFAULT FALSE,
    action_text TEXT,

    company VARCHAR(255),
    role VARCHAR(255),

    event_date DATETIME NULL,

    confidence DECIMAL(5,4),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (email_id) REFERENCES emails(id),

    UNIQUE KEY unique_email_analysis(email_id)
);
```

---

## jobs

```sql
CREATE TABLE jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL,

    company VARCHAR(255),
    role VARCHAR(255),

    status VARCHAR(50),

    application_date DATE,
    interview_date DATETIME,

    source_email_id BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## trips

```sql
CREATE TABLE trips (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL,

    title VARCHAR(255),

    destination VARCHAR(255),

    start_date DATE,
    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## events

```sql
CREATE TABLE events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL,

    title VARCHAR(500),
    event_type VARCHAR(50),

    start_time DATETIME,
    end_time DATETIME,

    location VARCHAR(500),

    source_email_id BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## tasks

```sql
CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL,

    title VARCHAR(500),
    description TEXT,

    due_date DATETIME,

    priority VARCHAR(20),

    completed BOOLEAN DEFAULT FALSE,

    source_email_id BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

# 9. Email Categories

Initially support:

```text
JOB
INTERVIEW
TRAVEL
MEETING
DEADLINE
DOCUMENT
FINANCE
PERSONAL
NEWSLETTER
PROMOTION
OTHER
```

The system should be able to add more categories later.

---

# 10. Importance System

Do not rely entirely on AI to determine importance.

Combine:

### AI classification

with:

### deterministic rules

Example:

```text
Interview invitation       → HIGH
Job opportunity            → HIGH
Deadline                   → HIGH
Flight confirmation        → HIGH
Payment failure            → HIGH

Meeting                    → MEDIUM
Document request           → MEDIUM

Newsletter                 → LOW
Marketing                  → LOW
Promotional email          → LOW
```

Store:

```text
importance_score
```

between:

```text
0 - 100
```

Dashboard should primarily display high-priority information.

---

# 11. AI Processing

The AI service should have a single well-defined responsibility:

> Convert an email into structured information.

The prompt should instruct the model to return JSON similar to:

```json
{
  "category": "JOB",
  "importance_score": 90,
  "summary": "Recruiter contacted the user about a Software Engineer opening.",
  "action_required": true,
  "action_text": "Review the opportunity and respond to the recruiter.",
  "company": "Example Company",
  "role": "Software Engineer",
  "event_date": null,
  "entities": {
    "location": "Bangalore",
    "deadline": null,
    "interview_stage": null
  }
}
```

Validate the JSON before storing it.

If AI fails:

1. Retry once.
2. If still unsuccessful, mark the email as `AI_PROCESSING_FAILED`.
3. Do not crash the sync process.

---

# 12. Email Processing Pipeline

Create:

```text
emailProcessor.js
```

It should:

```text
1. Receive email
2. Extract plain text
3. Remove HTML
4. Remove signatures where possible
5. Remove quoted previous messages
6. Truncate excessively large emails
7. Send cleaned content to Groq
8. Validate AI response
9. Store analysis
10. Create entities if relevant
```

One bad email must never stop processing of the remaining emails.

---

# 13. Gmail Service

Create:

```text
gmailService.js
```

Responsibilities:

* Create OAuth client
* Generate authorization URL
* Exchange authorization code
* Refresh access tokens
* Fetch Gmail profile
* Fetch messages
* Fetch message details
* Fetch threads
* Parse Gmail message payloads

Never put Gmail API logic directly inside controllers.

---

# 14. Authentication API

Implement:

```text
GET /api/auth/google
GET /api/auth/callback
GET /api/auth/me
POST /api/auth/logout
```

Flow:

```text
Frontend
   ↓
/api/auth/google
   ↓
Google
   ↓
/api/auth/callback
   ↓
Find/create user
   ↓
Store Gmail account
   ↓
Create application session
   ↓
Redirect dashboard
```

---

# 15. Email API

Implement:

```text
GET  /api/emails
GET  /api/emails/:id
POST /api/emails/sync
POST /api/emails/:id/process
```

Support pagination.

Do not return thousands of emails in one API response.

Example:

```text
GET /api/emails?page=1&limit=20
```

---

# 16. Dashboard API

Create:

```text
GET /api/dashboard/today
```

Response:

```json
{
  "urgent": [],
  "upcoming": [],
  "jobs": [],
  "trips": [],
  "tasks": [],
  "importantEmails": []
}
```

This should be the primary endpoint used by the home screen.

---

# 17. Jobs API

```text
GET /api/jobs
GET /api/jobs/:id
```

Eventually:

```text
GET /api/jobs/:id/timeline
```

The system should automatically create/update job records based on email analysis.

Possible statuses:

```text
DISCOVERED
APPLIED
SHORTLISTED
ASSESSMENT
INTERVIEW
OFFER
REJECTED
WITHDRAWN
UNKNOWN
```

---

# 18. Trips API

```text
GET /api/trips
GET /api/trips/:id
```

Eventually group related travel emails into one trip.

Example:

```text
Flight confirmation
+
Hotel confirmation
+
Cab booking
+
Conference registration
```

should become one trip where appropriate.

---

# 19. Tasks API

```text
GET /api/tasks
PATCH /api/tasks/:id
```

Allow the user to mark tasks complete.

---

# 20. Frontend Design

The frontend should be:

* Minimal
* Clean
* Mobile-first
* Fast
* No frontend framework
* No excessive animations

The design should feel like a **personal productivity/AI assistant**, not Gmail.

---

# 21. Main Dashboard

The dashboard should contain:

```text
Header
↓
Greeting
↓
Needs Attention
↓
Upcoming
↓
Job Updates
↓
Travel
↓
Important Emails
```

Example:

```text
Good morning, Prateek 👋

Here's what matters today.

────────────────────

🔴 NEEDS ATTENTION

🎯 Cisco Interview
Tomorrow · 11:00 AM

📄 Submit documents
Due tomorrow

────────────────────

📅 UPCOMING

Aug 27
Cisco Interview

Sep 03
Delhi Trip

────────────────────

💼 JOB UPDATES

Cisco
Interview scheduled

Deloitte
Recruiter replied
```

---

# 22. Mobile Navigation

Use bottom navigation:

```text
Home
Jobs
Trips
Emails
Settings
```

Desktop can use a sidebar.

---

# 23. Login Page

Keep it extremely simple:

```text
Gmail Intelligence

Understand what matters
in your inbox.

[ Continue with Google ]
```

Explain briefly:

```text
We use read-only Gmail access
to analyze your emails.
```

---

# 24. Email Detail

Show:

```text
Sender
Subject
Date

Importance

AI Summary

Detected Information

Action Required

Original Email
```

Example:

```text
Cisco

Software Engineer Interview

HIGH PRIORITY

AI SUMMARY

Cisco has invited you for a
technical interview.

────────────────

📅 August 27
⏰ 11:00 AM

ACTION REQUIRED

Prepare for technical interview.

────────────────

View original email
```

---

# 25. Jobs Screen

Display job cards:

```text
Cisco
Software Engineer
Interview
Aug 27

Deloitte
SDE
Applied

Microsoft
Software Engineer
Waiting
```

---

# 26. Trips Screen

Display:

```text
Delhi Trip

Sep 3 → Sep 5

✈ Bangalore → Delhi

🏨 Hotel

2 bookings
4 related emails
```

---

# 27. Emails Screen

Filters:

```text
All
Important
Jobs
Travel
Interviews
Deadlines
```

Search:

```text
Search emails...
```

Pagination required.

---

# 28. Settings

Include:

```text
Connected Gmail
Sync Gmail
Last synced
Email processing status

Privacy
Delete my data

Disconnect Gmail

Logout
```

---

# 29. AI Assistant — Phase 2 Feature

Do not implement this before the core application works.

Endpoint:

```text
POST /api/ai/ask
```

Example request:

```json
{
  "question": "What interviews do I have this month?"
}
```

The assistant should query structured application data first.

It should not send the entire inbox to Groq.

Examples:

```text
What do I have tomorrow?

What interviews are coming up?

Which companies have I applied to?

Which recruiters contacted me?

What deadlines do I have?

When is my next trip?
```

---

# 30. Synchronization

### V1

Manual:

```text
[ Sync Gmail ]
```

### V2

Incremental synchronization.

Store:

```text
history_id
last_synced_at
```

Use Gmail's incremental history mechanism where appropriate.

The system should not reprocess previously analyzed emails unnecessarily.

---

# 31. Processing Strategy

For initial synchronization:

```text
Fetch latest 100 emails
        ↓
Store emails
        ↓
Process sequentially or in controlled batches
        ↓
Update dashboard
```

Do not send 100 simultaneous Groq requests.

Use controlled concurrency.

Later introduce a proper background queue if needed.

---

# 32. Error Handling

Every external integration can fail.

Handle:

### Gmail failure

```text
GMAIL_AUTH_FAILED
GMAIL_TOKEN_EXPIRED
GMAIL_API_ERROR
```

### Groq failure

```text
AI_TIMEOUT
AI_RATE_LIMIT
AI_INVALID_RESPONSE
```

### Database

```text
DB_CONNECTION_ERROR
DB_QUERY_ERROR
```

The API should return clean JSON errors.

Never expose stack traces or secrets to the frontend.

---

# 33. Logging

Use structured server-side logs.

Examples:

```text
OAuth callback successful
Gmail sync started
Gmail sync completed
Email processing started
AI processing failed
Dashboard request
```

Never log:

* OAuth refresh tokens
* Access tokens
* API keys
* passwords
* full email bodies

---

# 34. Security Requirements

Mandatory:

* `.env` ignored
* Secrets only server-side
* HTTPS in production
* HTTP-only secure authentication cookie where practical
* Validate all request parameters
* Parameterized SQL queries
* No SQL string concatenation
* No Gmail tokens sent to frontend
* No API keys in frontend
* Error messages sanitized
* Rate limiting on public endpoints
* CORS restricted to configured frontend origin

---

# 35. Development Milestones

The coding agent should implement the project in this exact order.

## Milestone 1 — Foundation

Implement:

```text
Express
MySQL
Static frontend
Health endpoint
Environment configuration
```

Success criteria:

```text
GET /api/health → 200
GET /api/health/db → 200
Frontend loads
```

---

## Milestone 2 — Google OAuth

Implement:

```text
Google OAuth
users table
gmail_accounts table
JWT/session
```

Success criteria:

```text
Click Connect Gmail
→ Google login
→ consent
→ callback
→ dashboard
```

---

## Milestone 3 — Gmail

Implement:

```text
Gmail API
email table
sync endpoint
email list
email detail
```

Success criteria:

```text
Click Sync
→ latest Gmail messages stored
→ emails visible in UI
```

---

## Milestone 4 — AI

Implement:

```text
Groq integration
email cleaning
structured AI output
email_analysis table
```

Success criteria:

```text
Email
→ Groq
→ valid JSON
→ stored analysis
```

---

## Milestone 5 — Dashboard

Implement:

```text
Important
Upcoming
Jobs
Trips
Tasks
Important emails
```

Success criteria:

> User can open the application and immediately understand what needs attention.

---

## Milestone 6 — Job intelligence

Implement automatic job detection and status tracking.

---

## Milestone 7 — Travel intelligence

Implement trip detection and grouping.

---

## Milestone 8 — Tasks/deadlines

Implement action extraction and task management.

---

## Milestone 9 — Search/filter

Implement email search and category filters.

---

## Milestone 10 — AI assistant

Implement natural-language questions against structured data.

---

## Milestone 11 — Incremental sync

Implement efficient Gmail synchronization.

---

## Milestone 12 — Production hardening

Implement:

* Security
* Logging
* Rate limiting
* Error handling
* Loading states
* Empty states
* Mobile polish
* Deployment
* README

---

# 36. Definition of Done

The project is considered complete when a new user can:

```text
1. Open the website
       ↓
2. Click "Continue with Google"
       ↓
3. Grant Gmail read-only access
       ↓
4. Return to dashboard
       ↓
5. Sync Gmail
       ↓
6. Emails are fetched
       ↓
7. Emails are analyzed by Groq
       ↓
8. Important information is extracted
       ↓
9. Dashboard shows:
       - Important emails
       - Jobs
       - Interviews
       - Trips
       - Events
       - Tasks
       - Deadlines
       ↓
10. User can inspect original emails
```

---

# 37. Important Engineering Rules for the Coding Agent

1. **Do not implement the entire project in one giant change.**
2. Complete one milestone at a time.
3. After each milestone, run/build/test the application.
4. Fix errors before moving to the next milestone.
5. Keep controllers thin.
6. Put Gmail logic in `gmailService.js`.
7. Put Groq logic in `aiService.js`.
8. Put email parsing/cleaning in dedicated services.
9. Use parameterized MySQL queries.
10. Never hardcode credentials.
11. Never expose Gmail refresh tokens.
12. Never expose Groq or Google secrets to frontend.
13. Do not use React or any frontend framework.
14. Do not introduce unnecessary dependencies.
15. Keep the frontend mobile-first.
16. Use reusable CSS components.
17. Add proper loading, error and empty states.
18. Do not process the same Gmail message repeatedly.
19. One malformed email must not break an entire sync.
20. Validate all AI output before inserting it into MySQL.

---

# 38. First Implementation Target

**Do not start with AI.**

The coding agent's first target should be only:

```text
GitHub repo
   ↓
Express server
   ↓
MySQL connection
   ↓
Basic HTML frontend
   ↓
Render deployment
```

Then:

```text
Google OAuth
```

Then:

```text
Gmail API
```

Then:

```text
Groq
```

Then the dashboard.

That order will make debugging substantially easier because when something breaks, there will only be one new integration to investigate.
