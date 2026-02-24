import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

console.log("Server script starting...");
console.log("CWD:", process.cwd());
try {
  console.log("Files in CWD:", fs.readdirSync("."));
} catch (e) {
  console.error("Failed to list files:", e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  let db: any;
  try {
    const app = express();
    const PORT = 3000;

    app.get("/api/test", (req, res) => {
      res.json({ message: "API is reachable at the very top", env: process.env.NODE_ENV });
    });

    console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);

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

    // Request logging - MOVE TO TOP
    app.use((req, res, next) => {
      const logLine = `[${new Date().toISOString()}] ${req.method} ${req.url} (Host: ${req.headers.host})\n`;
      console.log(logLine.trim());
      try {
        fs.appendFileSync("access.log", logLine);
      } catch (e) {}
      next();
    });

    // Root-level health check
    app.get("/health-check", (req, res) => {
      res.send("OK");
    });

    const apiRouter = express.Router();

    apiRouter.get("/test", (req, res) => {
      res.json({ message: "API is reachable", env: process.env.NODE_ENV });
    });

    apiRouter.get("/debug-headers", (req, res) => {
      res.json({ headers: req.headers, url: req.url, method: req.method });
    });

    apiRouter.get("/health", (req, res) => {
      res.json({ 
        status: "ok", 
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
      });
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

    apiRouter.post("/auth/signup", signupHandler);
    apiRouter.post("/auth/signup/", signupHandler);

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

    apiRouter.post("/auth/login", loginHandler);
    apiRouter.post("/auth/login/", loginHandler);

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

    apiRouter.get("/transactions", getTransactionsHandler);
    apiRouter.get("/transactions/", getTransactionsHandler);

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

    apiRouter.post("/transactions", postTransactionsHandler);
    apiRouter.post("/transactions/", postTransactionsHandler);

    app.use("/v1", apiRouter);

    // Debug: Log all requests that reach this point
    app.use("/v1/*", (req, res, next) => {
      console.log(`API Fallthrough: ${req.method} ${req.url}`);
      next();
    });

  // Catch-all for API routes
  app.all("/v1/*", (req, res) => {
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
