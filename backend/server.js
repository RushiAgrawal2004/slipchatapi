const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Conversation history storage
const conversations = new Map();

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation history
        if (!conversations.has(sessionId)) {
            conversations.set(sessionId, []);
        }

        const conversationHistory = conversations.get(sessionId);

        // ✅ FIXED: Use current Gemini 2.5 Flash model (2025)
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',  // Updated to 2.5
            systemInstruction: 'You are BotPenguin, a helpful and friendly customer service assistant. You help users with their questions about products, services, and general inquiries. Be concise, helpful, and professional. Keep responses under 150 words unless more detail is specifically requested.'
        });

        // Start chat with history
        const chat = model.startChat({
            history: conversationHistory,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            },
        });

        // Send message
        const result = await chat.sendMessage(message);
        const aiReply = result.response.text();

        // Update conversation history
        conversationHistory.push({
            role: 'user',
            parts: [{ text: message }],
        });
        conversationHistory.push({
            role: 'model',
            parts: [{ text: aiReply }],
        });

        // Limit history to last 20 messages
        if (conversationHistory.length > 20) {
            conversationHistory.splice(0, conversationHistory.length - 20);
        }

        res.json({ 
            reply: aiReply,
            sessionId: sessionId 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to get response from AI',
            details: error.message 
        });
    }
});

// Clear conversation history
app.post('/api/clear-history', (req, res) => {
    const { sessionId = 'default' } = req.body;
    conversations.delete(sessionId);
    res.json({ message: 'Conversation history cleared' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'BotPenguin API is running with Gemini 2.5',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🐧 BotPenguin backend server running on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Using: Google Gemini 2.5 Flash`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables!');
        console.warn('   Please create a .env file with your Gemini API key.');
    } else {
        console.log('✅ Gemini API Key loaded successfully');
    }
});
