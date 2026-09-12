import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

export const sendMessage = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { content, model = 'gemini-3.8-flash' } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Safety check for valid MongoDB ObjectId
    if (!chatId || chatId === 'undefined' || chatId === 'null' || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    // 1. Verify conversation belongs to user
    const chat = await Conversation.findOne({ _id: chatId, userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // 2. Save User Message to DB
    const userMsg = new Message({
      conversationId: chatId,
      role: 'user',
      content
    });
    await userMsg.save();

    // Auto update title if it's 'New Chat'
    if (chat.title === 'New Chat') {
      chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      await chat.save();
    }

    // Fetch full history for AI context
    const historyMessages = await Message.find({ conversationId: chatId }).sort({ createdAt: 1 });

    // 3. SSE Setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullAiResponse = '';

    // 4. Model Selection & Lazy Initialization with Fallback
    if (model.startsWith('gemini')) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is missing in environment variables');

      const googleAI = new GoogleGenAI({ apiKey });
      const contents = historyMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      let responseStream;
      let activeGeminiModel = 'gemini-3.8-flash';

      try {
        // Pehle primary 3.8-flash model try karo
        responseStream = await googleAI.models.generateContentStream({
          model: activeGeminiModel, 
          contents: contents,
        });
      } catch (primaryError) {
        console.warn(`Primary model ${activeGeminiModel} unavailable, switching to fallback...`);
        
        // Agar 503 ya koi issue ho toh fallback model use karo
        activeGeminiModel = 'gemini-2.5-flash';
        responseStream = await googleAI.models.generateContentStream({
          model: activeGeminiModel, 
          contents: contents,
        });
      }

      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullAiResponse += chunk.text;
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }

    } else if (model.startsWith('gpt')) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY is missing in environment variables');

      const openai = new OpenAI({ apiKey });
      const openaiMessages = historyMessages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const stream = await openai.chat.completions.create({
        model: model || 'gpt-4o',
        messages: openaiMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          fullAiResponse += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }

    } else if (model.startsWith('claude')) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is missing in environment variables');

      const anthropic = new Anthropic({ apiKey });
      const claudeMessages = historyMessages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const stream = await anthropic.messages.stream({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: claudeMessages,
      });

      for await (const chunk of stream) {
        const text = chunk.delta?.text || '';
        if (text) {
          fullAiResponse += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }
    } else {
      throw new Error('Invalid model selected');
    }

    // 5. Save AI Response to DB
    const aiMsg = new Message({
      conversationId: chatId,
      role: 'ai',
      content: fullAiResponse
    });
    await aiMsg.save();

    res.write(`data: ${JSON.stringify({ done: true, messageId: aiMsg._id })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Database/AI Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to process request' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
};