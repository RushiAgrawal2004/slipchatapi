import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Check for missing API key early
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const conversations = new Map();

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!conversations.has(sessionId)) conversations.set(sessionId, []);
    const conversationHistory = conversations.get(sessionId);

    console.log("💬 Incoming message:", message);

    // Initialize model safely
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // ✅ make sure this model exists for your key
      systemInstruction:
        "You are Slipchat, a friendly AI chatbot that helps users with queries about products, services, or general questions. Keep responses short, clear, and polite.",
    });

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const aiReply = result.response.text();

    console.log("🤖 AI Reply:", aiReply);

    conversationHistory.push({ role: "user", parts: [{ text: message }] });
    conversationHistory.push({ role: "model", parts: [{ text: aiReply }] });

    if (conversationHistory.length > 20)
      conversationHistory.splice(0, conversationHistory.length - 20);

    res.json({ reply: aiReply, sessionId });
  } catch (error) {
    console.error("🔥 Gemini API Error:", error);
    res.status(500).json({
      error: "Failed to get response from AI",
      details: error.message || error.toString(),
    });
  }
});

export default app;
