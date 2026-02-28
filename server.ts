import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { promises as fsPromises } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Root-level health check
app.get("/ping", (req, res) => res.send("pong"));

const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV === "development";

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mock API Router (to avoid 404s if frontend still calls them)
const apiRouter = express.Router();

const USER_DATA_FILE = path.join(__dirname, "data", "user_data.json");

// Helper to ensure data directory and file exist
async function ensureDataFile() {
  const dir = path.dirname(USER_DATA_FILE);
  if (!fs.existsSync(dir)) {
    await fsPromises.mkdir(dir, { recursive: true });
  }
  if (!fs.existsSync(USER_DATA_FILE)) {
    await fsPromises.writeFile(USER_DATA_FILE, JSON.stringify({}));
  }
}

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "full-stack-enabled" });
});

// GET user data by user_id
apiRouter.get("/user-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await ensureDataFile();
    const data = await fsPromises.readFile(USER_DATA_FILE, "utf-8");
    const userDataMap = JSON.parse(data);
    
    const userData = userDataMap[userId] || { settings: {}, history: [], preferences: {} };
    
    res.json({ success: true, data: userData });
  } catch (error: any) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
});

// POST/UPDATE user data
apiRouter.post("/user-data", async (req, res) => {
  try {
    const { userId, data: newData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await ensureDataFile();
    const fileContent = await fsPromises.readFile(USER_DATA_FILE, "utf-8");
    const userDataMap = JSON.parse(fileContent);
    
    // Merge or replace data
    userDataMap[userId] = {
      ...(userDataMap[userId] || {}),
      ...newData,
      updatedAt: new Date().toISOString()
    };
    
    await fsPromises.writeFile(USER_DATA_FILE, JSON.stringify(userDataMap, null, 2));
    
    res.json({ success: true, message: "User data saved successfully" });
  } catch (error: any) {
    console.error("Error saving user data:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
});

app.use("/api", apiRouter);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message
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

// In AI Studio or local development, we always need to listen on port 3000.
if (process.env.NODE_ENV === "development" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

export default app;
