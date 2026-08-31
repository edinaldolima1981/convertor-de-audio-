import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for custom Gemini consultation
  app.post("/api/ask", async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Configure system instruction to guide the conversation on technical architecture, legal, and ethics.
      const systemInstruction = `You are an elite, professional Technical Architect and Copyright Specialist specializing in audio-visual processing, media pipelines, and intellectual property.
Your task is to provide objective, extremely structured, and expert answers about:
1. Converting screen recordings of media players/playback into MP3/WAV formats.
2. Low-level audio processing (FFmpeg commands, libavcodec, WebAssembly audio pipelines like ffmpeg.wasm, and Web Audio API).
3. Compression techniques (MP3 LAME encoding, VBR vs CBR, bitrates, sample rates, psychoacoustic models).
4. Full Legal & Ethical analysis (YouTube Terms of Service Section 5, DMCA, Copyright laws, Fair Use exceptions, personal archive vs distribution).
5. Mitigation of development challenges (variable framerates, audio-video sync drift, browser tab resource limits, silent pads, metadata tagging).

Keep explanations elegant, professional, and dense with practical implementation guidelines. Use clear markdown styling. Use typescript/bash block code where appropriate. Keep responses concise and directly relevant to the user's audio-extraction query.`;

      // Build chat contents
      const chatContents = [
        { role: "user", parts: [{ text: systemInstruction }] },
        ...(history || []).map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        })),
        { role: "user", parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: chatContents,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate expert advice" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
