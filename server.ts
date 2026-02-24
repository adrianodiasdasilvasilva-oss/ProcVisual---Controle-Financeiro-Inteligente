import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  let db: any;
  try {
    const app = express();
    const PORT = 3000;

    console.log("Starting server...");

    db = new Database("database.db");
    console.log("Database connected");

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
    console.log("Database initialized");

    app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Auth Endpoints
  const signupHandler = (req: any, res: any) => {
    console.log("Signup attempt:", req.body.email);
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes" });
    }
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)");
      stmt.run(name, email, phone, password);
      res.json({ success: true, message: "User registered successfully" });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ success: false, message: "Email já cadastrado" });
      } else {
        res.status(500).json({ success: false, message: `Erro interno: ${error.message}` });
      }
    }
  };

  app.post("/api/auth/signup", signupHandler);
  app.post("/api/auth/signup/", signupHandler);

  const loginHandler = (req: any, res: any) => {
    console.log("Login attempt:", req.body.email);
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
      if (user) {
        res.json({ success: true, user: { name: user.name, email: user.email } });
      } else {
        res.status(401).json({ success: false, message: "Email ou senha inválidos" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: `Erro interno: ${error.message}` });
    }
  };

  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/login/", loginHandler);

  // Transaction Endpoints
  const getTransactionsHandler = (req: any, res: any) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    try {
      const transactions = db.prepare("SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC").all(email);
      res.json(transactions);
    } catch (error: any) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  app.get("/api/transactions", getTransactionsHandler);
  app.get("/api/transactions/", getTransactionsHandler);

  const postTransactionsHandler = (req: any, res: any) => {
    const { user_email, type, amount, category, date, description, installments } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO transactions (user_email, type, amount, category, date, description, installments) VALUES (?, ?, ?, ?, ?, ?, ?)");
      stmt.run(user_email, type, amount, category, date, description, installments);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Post transactions error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  app.post("/api/transactions", postTransactionsHandler);
  app.post("/api/transactions/", postTransactionsHandler);

  // Catch-all for API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (error) {
    console.error("CRITICAL SERVER ERROR:", error);
    process.exit(1);
  }
}

startServer();
