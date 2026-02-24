import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV === "development";

// Database Connection (Persistent in AI Studio environment)
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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Router
const apiRouter = express.Router();

apiRouter.get("/test", (req, res) => {
  res.json({ 
    message: "API is reachable", 
    env: process.env.NODE_ENV, 
    storage: "SQLite (Local Persistent)" 
  });
});

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
      return res.status(400).json({ success: false, message: "Email já cadastrado" });
    }
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      return res.json({ success: true, user: { name: user.name, email: user.email } });
    }
    res.status(401).json({ success: false, message: "Email ou senha inválidos" });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message });
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
    console.error("Get Transactions Error:", error);
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
    console.error("Post Transaction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use("/api", apiRouter);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: isDev ? err.stack : undefined 
  });
});

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

// Na Vercel, não chamamos app.listen(). Exportamos o app e a Vercel lida com o resto.
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

export default app;
