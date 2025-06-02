import { Router, Request, Response } from 'express';
import { chatService } from '../services/chatService';
import ChatMessage from '../models/chat';
import Restaurant from '../models/restraunt';
import Menu from '../models/menuitem';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

// POST /api/chat/send - Send message and get AI response
router.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId, tableId, message, sessionId } = req.body;

    if (!restaurantId || !tableId || !message) {
       res.status(400).json({
        success: false,
        message: 'Restaurant ID, table ID, and message are required'
      });
    }

    // Get restaurant info
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
       res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get menu items for context
    const menuItems = await Menu.find({ restaurantId }).select('name description price category');

    // Create or get existing chat session
    const currentSessionId = sessionId || uuidv4();
    let chatSession = await ChatMessage.findOne({ sessionId: currentSessionId });

    if (!chatSession) {
      chatSession = new ChatMessage({
        restaurantId,
        tableId,
        sessionId: currentSessionId,
        messages: []
      });
    }

    // Prepare context for AI
    const context = {
      restaurantId,
      tableId,
      restaurantName: restaurant?.name,
      menuItems
    };

    // Get chat history for context (last 10 messages)
    const chatHistory = chatSession.messages
      .slice(-10)
      .map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

    // Get AI response
    const aiResponse = await chatService.getResponse(message, chatHistory, context);

    // Add messages to session
    chatSession.messages.push(
      {
        role: 'user',
        content: message,
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
    );

    await chatSession.save();

    res.json({
      success: true,
      response: aiResponse,
      sessionId: currentSessionId,
      messageCount: chatSession.messages.length
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/chat/history/:sessionId - Get chat history
router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await ChatMessage.findOne({ sessionId });
    if (!chatSession) {
       res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      messages: chatSession?.messages,
      sessionInfo: {
        restaurantId: chatSession?.restaurantId,
        tableId: chatSession?.tableId,
        isActive: chatSession?.isActive,
        createdAt: chatSession?.createdAt
      }
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history'
    });
  }
});

// POST /api/chat/recommendations - Get AI menu recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { restaurantId, preferences, tableId } = req.body;

    if (!restaurantId || !preferences) {
       res.status(400).json({
        success: false,
        message: 'Restaurant ID and preferences are required'
      });
    }

    // Get restaurant and menu
    const restaurant = await Restaurant.findById(restaurantId);
    const menuItems = await Menu.find({ restaurantId }).select('name description price category');

    if (!restaurant || !menuItems.length) {
       res.status(404).json({
        success: false,
        message: 'Restaurant or menu not found'
      });
    }

    const context = {
      restaurantId,
      tableId: tableId || 'unknown',
      restaurantName: restaurant?.name,
      menuItems
    };

    const recommendations = await chatService.generateMenuRecommendations(
      preferences,
      menuItems,
      context
    );

    res.json({
      success: true,
      recommendations,
      menuItemsCount: menuItems.length
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// DELETE /api/chat/session/:sessionId - Clear chat session
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    await ChatMessage.findOneAndUpdate(
      { sessionId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Chat session ended'
    });

  } catch (error) {
    console.error('Chat session end error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end chat session'
    });
  }
});

export default router;