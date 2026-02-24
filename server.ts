import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV === "development";

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized");
} else {
  console.warn("SUPABASE_URL or SUPABASE_KEY missing. Using In-Memory Fallback.");
}

// Mock Fallback Data
let mockUsers: any[] = [];
let mockTransactions: any[] = [];

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
    storage: supabase ? "Supabase (Postgres)" : "In-Memory (Mock)" 
  });
});

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// Auth Endpoints
apiRouter.post("/auth/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes" });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, phone, password }])
        .select();

      if (error) {
        if (error.code === '23505') { // Postgres unique constraint violation
          return res.status(400).json({ success: false, message: "Email já cadastrado" });
        }
        throw error;
      }
      return res.json({ success: true, message: "User registered successfully" });
    } catch (error: any) {
      console.error("Supabase Signup Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  } else {
    // Mock Fallback
    if (mockUsers.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: "Email já cadastrado (Mock)" });
    }
    mockUsers.push({ name, email, phone, password });
    return res.json({ success: true, message: "User registered successfully (Mock Mode)" });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        return res.status(401).json({ success: false, message: "Email ou senha inválidos" });
      }
      return res.json({ success: true, user: { name: data.name, email: data.email } });
    } catch (error: any) {
      console.error("Supabase Login Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  } else {
    // Mock Fallback
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      return res.json({ success: true, user: { name: user.name, email: user.email } });
    }
    return res.status(401).json({ success: false, message: "Email ou senha inválidos (Mock)" });
  }
});

// Transaction Endpoints
apiRouter.get("/transactions", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', email)
        .order('date', { ascending: false });

      if (error) throw error;
      return res.json(data);
    } catch (error: any) {
      console.error("Supabase Get Transactions Error:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    // Mock Fallback
    const transactions = mockTransactions.filter(t => t.user_email === email);
    return res.json(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }
});

apiRouter.post("/transactions", async (req, res) => {
  const { user_email, type, amount, category, date, description, installments } = req.body;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ user_email, type, amount, category, date, description, installments }]);

      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Supabase Post Transaction Error:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    // Mock Fallback
    mockTransactions.push({ user_email, type, amount, category, date, description, installments });
    return res.json({ success: true });
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
