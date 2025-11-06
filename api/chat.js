/**
 * Slipchat AI Backend Server
 * -----------------------------------------------
 * Features:
 * ✅ Gemini 2.5 Flash integration
 * ✅ API key authentication (for embedding)
 * ✅ Optional user-specific system prompts
 * ✅ Chat history (per session)
 * ✅ Easy to expand into multi-tenant SaaS
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory data stores (replace with MongoDB or PostgreSQL later)
const VALID_API_KEYS = new Set(['demo_key_123', 'user_abc456', 'test_key_789']);
const conversations = new Map();

// ✅ Middleware: Validate Slipchat API Key
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing Slipchat API key' });
  }
  req.slipchatApiKey = apiKey;
  next();
}

// 🧠 Dynamic system instructions per API key (optional)
const SYSTEM_PROMPTS = {
  demo_key_123: 'You are Slipchat Demo Bot — a cheerful assistant showcasing Slipchat features to visitors.',
  user_abc456: 'You are Slipchat Real Estate Assistant — help users find and compare properties clearly and concisely.',
  test_key_789: 'You are Slipchat Education Bot — a friendly AI that helps students understand tech concepts.',
};

// 🚀 Chat Endpoint
app.post('/api/chat', validateApiKey, async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize or get conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const conversationHistory = conversations.get(sessionId);

    // Choose personality based on API key
    const systemInstruction =
      SYSTEM_PROMPTS[req.slipchatApiKey] ||
      'You are Slipchat, a smart and friendly AI assistant. Always introduce yourself as Slipchat and never mention any other name. You help users with their queries about products, services, and general information. Keep your answers concise, professional, and easy to understand.';

    // Initialize Gemini Model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    });

    // Generate response
    const result = await chat.sendMessage(message);
    const aiReply = result.response.text();

    // Update chat history (keep last 20 exchanges)
    conversationHistory.push({ role: 'user', parts: [{ text: message }] });
    conversationHistory.push({ role: 'model', parts: [{ text: aiReply }] });
    if (conversationHistory.length > 40) {
      conversationHistory.splice(0, conversationHistory.length - 40);
    }

    // Respond to frontend
    res.json({ reply: aiReply, sessionId });

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message,
    });
  }
});

// 🧹 Clear conversation history (optional endpoint)
app.post('/api/clear-history', validateApiKey, (req, res) => {
  const { sessionId = 'default' } = req.body;
  conversations.delete(sessionId);
  res.json({ message: 'Conversation history cleared' });
});

// 🆕 Register new API key (for testing / dashboard use)
app.post('/api/register', (req, res) => {
  const newKey = 'user_' + crypto.randomBytes(8).toString('hex');
  VALID_API_KEYS.add(newKey);
  res.json({
    message: 'New Slipchat API key generated successfully',
    apiKey: newKey,
  });
});

// 🏥 Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Slipchat AI backend running with Gemini 2.5 Flash',
    validKeys: VALID_API_KEYS.size,
    timestamp: new Date().toISOString(),
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`💬 Slipchat backend server running on port ${PORT}`);
  console.log(`📡 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🧠 Register API: http://localhost:${PORT}/api/register`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 Model: Gemini 2.5 Flash`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ WARNING: GEMINI_API_KEY not found in .env');
  } else {
    console.log('✅ Gemini API Key loaded successfully');
  }
});
