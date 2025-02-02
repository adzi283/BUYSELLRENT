const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const Order = require('../models/Order');
const Item = require('../models/Item');
const axios = require('axios');

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function getAIResponse(messages) {
  try {
    const response = await axios.post(
      GEMINI_API_ENDPOINT,
      {
        contents: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.AI_API_KEY
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw new Error('Failed to get AI response');
  }
}

// Initialize chat session
exports.initializeSession = async (req, res) => {
  try {
    // Check for existing active session
    let session = await ChatSession.findOne({
      user: req.user.id,
      isActive: true
    });

    if (!session) {
      // Get user's orders and active listings
      const [orders, items] = await Promise.all([
        Order.find({ $or: [{ buyer: req.user.id }, { seller: req.user.id }] })
          .sort('-createdAt')
          .limit(5),
        Item.find({ seller: req.user.id, status: 'available' })
          .sort('-createdAt')
          .limit(5)
      ]);

      // Create context message with user's data
      const contextMessage = {
        role: 'assistant',
        content: "Hi! I'm your IIITH Buy-Sell assistant. How can I help you today?"
      };

      // Create new session
      session = await ChatSession.create({
        user: req.user.id,
        messages: [contextMessage]
      });
    }

    res.status(200).json({
      status: 'success',
      data: { session }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Send message and get AI response
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }

    // Get session and verify ownership
    const session = await ChatSession.findById(sessionId);
    if (!session || session.user.toString() !== req.user.id) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message
    });

    // Prepare conversation history for AI
    const conversationHistory = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const aiResponse = await getAIResponse(conversationHistory);
      
      // Add AI response to session
      session.messages.push({
        role: 'assistant',
        content: aiResponse
      });

      session.lastActivity = Date.now();
      await session.save();

      res.status(200).json({
        status: 'success',
        data: {
          message: aiResponse
        }
      });
    } catch (error) {
      console.error('AI API Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get AI response'
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({
      user: req.user.id
    }).sort('-lastActivity');

    res.status(200).json({
      status: 'success',
      data: { sessions }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Close chat session
exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOneAndUpdate(
      {
        _id: sessionId,
        user: req.user.id
      },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { session }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
}; 