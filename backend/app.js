const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./src/config/database');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for secure cookies behind Render's proxy
app.set('trust proxy', 1);

// CORS configuration for credentials
app.use((req, res, next) => {
  const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- Database Migrations ---
const migrations = [
  {
    name: '20240101_create_users_table',
    query: `CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
    );`
  },
  {
    name: '20240102_create_gmail_accounts_table',
    query: `CREATE TABLE IF NOT EXISTS gmail_accounts (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        gmail_email VARCHAR(255) NOT NULL,
        refresh_token TEXT NOT NULL,
        history_id VARCHAR(255),
        last_synced_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`
  },
  {
    name: '20240103_create_emails_table',
    query: `CREATE TABLE IF NOT EXISTS emails (
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
        UNIQUE KEY unique_gmail_message (user_id, gmail_message_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`
  },
  {
    name: '20240104_create_email_analysis_table',
    query: `CREATE TABLE IF NOT EXISTS email_analysis (
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
    );`
  },
  {
    name: '20240105_create_jobs_table',
    query: `CREATE TABLE IF NOT EXISTS jobs (
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
    );`
  },
  {
    name: '20240106_create_trips_table',
    query: `CREATE TABLE IF NOT EXISTS trips (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        title VARCHAR(255),
        destination VARCHAR(255),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`
  },
  {
    name: '20240107_create_events_table',
    query: `CREATE TABLE IF NOT EXISTS events (
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
    );`
  },
  {
    name: '20240108_create_tasks_table',
    query: `CREATE TABLE IF NOT EXISTS tasks (
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
    );`
  },
  {
    name: '20240109_create_migrations_table',
    query: `CREATE TABLE IF NOT EXISTS migrations (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  }
];

async function runMigrations() {
  // Create migrations table if not exists (last migration in the list)
  await db.query(migrations[migrations.length - 1].query);

  // Get executed migrations - handle case where table might be empty
  let executed = new Set();
  try {
    const doneResult = await db.query('SELECT name FROM migrations');
    console.log(`Found ${doneResult.length} existing migrations:`, doneResult.map(m => m.name));
    executed = new Set(doneResult.map(m => m.name));
  } catch (err) {
    // Table might not exist yet or query failed - start with empty set
    console.log('No existing migrations found (first run)');
  }

  // Run pending migrations
  for (const migration of migrations) {
    if (!executed.has(migration.name)) {
      console.log(`Running migration: ${migration.name}`);
      await db.query(migration.query);
      const result = await db.query('INSERT IGNORE INTO migrations (name) VALUES (?)', [migration.name]);
      console.log(`Completed migration: ${migration.name} (affected rows: ${result.affectedRows || 'N/A'})`);
    } else {
      console.log(`Skipping migration (already executed): ${migration.name}`);
    }
  }

  // Verify final state
  const finalResult = await db.query('SELECT name FROM migrations');
  console.log(`Total migrations recorded: ${finalResult.length}`);

  console.log('All migrations completed.');
}

// Execute migrations before starting the server
runMigrations().catch(err => {
  console.error('Migration failed:', err);
  // Don't exit - allow server to start without migrations if DB connection failed
});



// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Parse cookies
app.use(cookieParser());

// Explicit routes for HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});
app.get('/jobs', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/jobs.html'));
});
app.get('/jobs.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/jobs.html'));
});
app.get('/trips', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/trips.html'));
});
app.get('/trips.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/trips.html'));
});
app.get('/emails', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/emails.html'));
});
app.get('/emails.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/emails.html'));
});
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/settings.html'));
});
app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/settings.html'));
});

// JWT middleware - attach req.user from cookie
app.use((req, res, next) => {
  let token = null;
  if (req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        googleId: decoded.googleId,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Database health endpoint
app.get('/api/health/db', (req, res) => {
  res.json({ status: 'ok', database: db.database, host: db.host });
});

// Simple route test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Email routes
const emailRoutes = require('./src/routes/emailRoutes');
app.use('/api/emails', emailRoutes);

// Dashboard route
const dashboardRoutes = require('./src/routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Jobs routes
const jobRoutes = require('./src/routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

// Trips routes
const tripRoutes = require('./src/routes/tripRoutes');
app.use('/api/trips', tripRoutes);

// Tasks routes
const taskRoutes = require('./src/routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

// Events routes
const eventRoutes = require('./src/routes/eventRoutes');
app.use('/api/events', eventRoutes);

// Catch-all 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
  } else {
    // Fallback to login page for unknown routes
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Health DB: http://localhost:${PORT}/api/health/db`);
});