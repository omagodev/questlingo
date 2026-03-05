import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3500;

// Security: Restrict CORS (In production, replace * with your frontend domain)
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || "*",
    methods: ["GET", "POST"],
  }),
);

app.use(express.json({ limit: "50mb" }));

const SAVES_DIR = path.join(__dirname, "saved_stories");

// Ensure saves directory exists
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR);
}

// Serve static files from the saves directory
app.use("/saved_stories", express.static(SAVES_DIR));

// AI Clients setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to sanitize path and prevent traversal
const sanitizePath = (p) => {
  const normalized = path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, "");
  return normalized;
};

// Helper to save base64 media to disk
const saveBase64Media = (base64String, folderPath, fileName) => {
  if (!base64String) return null;
  const matches = base64String.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    console.error(`Failed to match base64 for ${fileName}.`);
    return null;
  }
  const buffer = Buffer.from(matches[2], "base64");
  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, buffer);
  return fileName;
};

// --- AI Proxy Endpoints ---

app.post("/api/ai/openai/chat", async (req, res) => {
  try {
    const { messages, response_format, model, temperature } = req.body;
    const completion = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages,
      response_format,
      temperature,
    });
    res.json(completion);
  } catch (error) {
    console.error("OpenAI Chat Proxy Error:", error);
    res.status(500).json({ error: "AI Service Error" });
  }
});

app.post("/api/ai/openai/images", async (req, res) => {
  try {
    const { prompt, n, size, response_format } = req.body;
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n,
      size,
      response_format,
    });
    res.json(response);
  } catch (error) {
    console.error("OpenAI Image Proxy Error:", error);
    res.status(500).json({ error: "AI Image Error" });
  }
});

app.post("/api/ai/openai/speech", async (req, res) => {
  try {
    const { input, voice, model } = req.body;
    const response = await openai.audio.speech.create({
      model: model || "tts-1",
      voice,
      input,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    console.error("OpenAI Speech Proxy Error:", error);
    res.status(500).json({ error: "AI Speech Error" });
  }
});

// --- Storage Endpoints ---

// API: Save Game
app.post("/api/stories", (req, res) => {
  try {
    const gameState = req.body;
    if (!gameState || !gameState.player) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid game state" });
    }

    const storyId = sanitizePath(gameState.id || `save_${Date.now()}`);
    const storyDir = path.join(SAVES_DIR, storyId);
    gameState.id = storyId;

    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }

    // Process player avatar
    if (
      gameState.player.avatarUrl &&
      gameState.player.avatarUrl.startsWith("data:")
    ) {
      const fileName = saveBase64Media(
        gameState.player.avatarUrl,
        storyDir,
        "avatar.png",
      );
      if (fileName)
        gameState.player.avatarUrl = `/saved_stories/${storyId}/${fileName}`;
    }

    // Process history segments (images and audio)
    if (gameState.history) {
      gameState.history = gameState.history.map((segment, index) => {
        if (segment.imageUrl && segment.imageUrl.startsWith("data:")) {
          const fileName = saveBase64Media(
            segment.imageUrl,
            storyDir,
            `segment_${index}.png`,
          );
          if (fileName)
            segment.imageUrl = `/saved_stories/${storyId}/${fileName}`;
        }
        if (segment.audioUrl && segment.audioUrl.startsWith("data:")) {
          const fileName = saveBase64Media(
            segment.audioUrl,
            storyDir,
            `segment_${index}.mp3`,
          );
          if (fileName)
            segment.audioUrl = `/saved_stories/${storyId}/${fileName}`;
        }
        return segment;
      });
    }

    // Process current segment image and audio
    if (gameState.currentSegment) {
      if (
        gameState.currentSegment.imageUrl &&
        gameState.currentSegment.imageUrl.startsWith("data:")
      ) {
        const fileName = saveBase64Media(
          gameState.currentSegment.imageUrl,
          storyDir,
          `current_segment.png`,
        );
        if (fileName)
          gameState.currentSegment.imageUrl = `/saved_stories/${storyId}/${fileName}`;
      }
      if (
        gameState.currentSegment.audioUrl &&
        gameState.currentSegment.audioUrl.startsWith("data:")
      ) {
        const fileName = saveBase64Media(
          gameState.currentSegment.audioUrl,
          storyDir,
          `current_segment.mp3`,
        );
        if (fileName)
          gameState.currentSegment.audioUrl = `/saved_stories/${storyId}/${fileName}`;
      }
    }

    const saveSlot = {
      id: storyId,
      date: Date.now(),
      summary: `Lvl ${gameState.player.level} • ${gameState.theme} • ${new Date().toLocaleDateString()}`,
      state: gameState,
    };

    fs.writeFileSync(
      path.join(storyDir, "story.json"),
      JSON.stringify(saveSlot, null, 2),
    );

    res.json({
      success: true,
      id: storyId,
      message: "Game saved successfully",
    });
  } catch (error) {
    console.error("Error saving game:", error);
    res.status(500).json({ success: false, message: "Failed to save game" });
  }
});

// API: List Saves
app.get("/api/stories", (req, res) => {
  try {
    const saves = [];
    if (!fs.existsSync(SAVES_DIR)) return res.json([]);
    const dirs = fs.readdirSync(SAVES_DIR);

    for (const dir of dirs) {
      const storyId = sanitizePath(dir);
      const storyJsonPath = path.join(SAVES_DIR, storyId, "story.json");
      if (fs.existsSync(storyJsonPath)) {
        try {
          const data = fs.readFileSync(storyJsonPath, "utf8");
          const saveSlot = JSON.parse(data);
          saves.push({
            id: saveSlot.id,
            date: saveSlot.date,
            summary: saveSlot.summary,
          });
        } catch (e) {
          console.error(`Error reading save ${dir}:`, e);
        }
      }
    }
    saves.sort((a, b) => b.date - a.date);
    res.json(saves);
  } catch (error) {
    console.error("Error listing saves:", error);
    res.status(500).json({ success: false, message: "Failed to list saves" });
  }
});

// API: Load Save
app.get("/api/stories/:id", (req, res) => {
  try {
    const storyId = sanitizePath(req.params.id);
    const storyJsonPath = path.join(SAVES_DIR, storyId, "story.json");

    if (!fs.existsSync(storyJsonPath)) {
      return res
        .status(404)
        .json({ success: false, message: "Save not found" });
    }

    const data = fs.readFileSync(storyJsonPath, "utf8");
    const saveSlot = JSON.parse(data);
    res.json(saveSlot);
  } catch (error) {
    console.error("Error loading save:", error);
    res.status(500).json({ success: false, message: "Failed to load save" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
