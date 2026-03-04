import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images

const SAVES_DIR = path.join(__dirname, "saved_stories");

// Ensure saves directory exists
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR);
}

// Serve static files from the saves directory
app.use("/saved_stories", express.static(SAVES_DIR));

// Helper to save base64 media to disk
const saveBase64Media = (base64String, folderPath, fileName) => {
  if (!base64String) return null;
  const matches = base64String.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    console.error(
      `Failed to match base64 for ${fileName}. Header:`,
      base64String.substring(0, 50),
    );
    return null;
  }
  const buffer = Buffer.from(matches[2], "base64");
  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, buffer);
  return fileName;
};

// API: Save Game
app.post("/api/stories", (req, res) => {
  try {
    const gameState = req.body;
    const storyId = gameState.id || `save_${Date.now()}`;
    const storyDir = path.join(SAVES_DIR, storyId);
    gameState.id = storyId; // Append ID so it persists in the JSON

    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir);
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
      if (fileName) {
        gameState.player.avatarUrl = `/saved_stories/${storyId}/${fileName}`;
      }
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
          if (fileName) {
            segment.imageUrl = `/saved_stories/${storyId}/${fileName}`;
          }
        }

        if (segment.audioUrl && segment.audioUrl.startsWith("data:")) {
          const fileName = saveBase64Media(
            segment.audioUrl,
            storyDir,
            `segment_${index}.mp3`,
          );
          if (fileName) {
            segment.audioUrl = `/saved_stories/${storyId}/${fileName}`;
          }
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
        if (fileName) {
          gameState.currentSegment.imageUrl = `/saved_stories/${storyId}/${fileName}`;
        }
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
        if (fileName) {
          gameState.currentSegment.audioUrl = `/saved_stories/${storyId}/${fileName}`;
        }
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
    const dirs = fs.readdirSync(SAVES_DIR);

    for (const dir of dirs) {
      const storyJsonPath = path.join(SAVES_DIR, dir, "story.json");
      if (fs.existsSync(storyJsonPath)) {
        try {
          const data = fs.readFileSync(storyJsonPath, "utf8");
          const saveSlot = JSON.parse(data);
          // We strip the state for the list view to save bandwidth, or keep minimal info
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

    // Sort by date descending
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
    const storyId = req.params.id;
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
