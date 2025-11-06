import { GoogleGenerativeAI } from "@google/generative-ai";

// Global map to maintain conversation context
const conversations = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in environment variables.");
    return res.status(500).json({ error: "Missing Gemini API key" });
  }

  try {
    const { message, sessionId = "default" } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Create Gemini AI instance
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    if (!conversations.has(sessionId)) conversations.set(sessionId, []);
    const conversationHistory = conversations.get(sessionId);

    console.log("💬 Incoming message:", message);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // ✅ Ensure this model name exists for your API key
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

    // Update conversation memory
    conversationHistory.push({ role: "user", parts: [{ text: message }] });
    conversationHistory.push({ role: "model", parts: [{ text: aiReply }] });

    if (conversationHistory.length > 20) {
      conversationHistory.splice(0, conversationHistory.length - 20);
    }

    return res.status(200).json({ reply: aiReply, sessionId });
  } catch (error) {
    console.error("🔥 Gemini API Error:", error);
    return res.status(500).json({
      error: "Failed to get response from AI",
      details: error.message || error.toString(),
    });
  }
}
