import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV === "development";

// Database Connection
// NOTE: SQLite will not persist on Vercel. 
// For production on Vercel, consider using Vercel Postgres or Supabase.
const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL,
    amount TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    installments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
  );
`);

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  if (isDev) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Router
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// Auth Endpoints
apiRouter.post("/auth/signup", (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes" });
  }
  try {
    const stmt = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)");
    stmt.run(name, email, phone, password);
    res.json({ success: true, message: "User registered successfully" });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ success: false, message: "Email já cadastrado" });
    } else {
      res.status(500).json({ success: false, message: `Erro interno: ${error.message}` });
    }
  }
});

apiRouter.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ success: true, user: { name: user.name, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: "Email ou senha inválidos" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Erro interno: ${error.message}` });
  }
});

// Transaction Endpoints
apiRouter.get("/transactions", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC").all(email);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/transactions", (req, res) => {
  const { user_email, type, amount, category, date, description, installments } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO transactions (user_email, type, amount, category, date, description, installments) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(user_email, type, amount, category, date, description, installments);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api", apiRouter);

// Vite / Static Files
async function setupFrontend() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }
}

setupFrontend();

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

export default app;
