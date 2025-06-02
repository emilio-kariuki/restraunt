import OpenAI from 'openai';
import Groq from 'groq-sdk';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  restaurantId: string;
  tableId: string;
  restaurantName?: string;
  menuItems?: any[];
  orderHistory?: any[];
}

export class ChatService {
  private getSystemPrompt(context: ChatContext): string {
    return `You are a friendly AI dining assistant for ${context.restaurantName || 'the restaurant'}. 
    
Your role is to:
- Help customers with menu questions and recommendations
- Assist with ordering process
- Answer questions about the restaurant
- Provide information about ingredients, allergens, and dietary restrictions
- Help with special requests and accommodations
- Be conversational and engaging while they wait

Current context:
- Restaurant: ${context.restaurantName || 'Unknown'}
- Table: ${context.tableId}
- Available menu items: ${context.menuItems?.length || 0} items

Guidelines:
- Be friendly, helpful, and professional
- Keep responses concise but informative
- Ask follow-up questions to better assist
- If you don't know something specific about the restaurant, suggest they ask their server
- Don't make up menu items or prices
- Be enthusiastic about the dining experience

Respond in a conversational, helpful manner.`;
  }

  async chatWithOpenAI(
    messages: ChatMessage[],
    context: ChatContext
  ): Promise<string> {
    try {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: this.getSystemPrompt(context)
      };

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemMessage, ...messages],
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      return completion.choices[0]?.message?.content || 
        "I apologize, but I'm having trouble responding right now. Please try again or ask your server for assistance.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async chatWithGroq(
    messages: ChatMessage[],
    context: ChatContext
  ): Promise<string> {
    try {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: this.getSystemPrompt(context)
      };

      const completion = await groq.chat.completions.create({
        messages: [systemMessage, ...messages],
        model: 'mixtral-8x7b-32768',
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
      });

      return completion.choices[0]?.message?.content || 
        "I apologize, but I'm having trouble responding right now. Please try again or ask your server for assistance.";
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('Failed to get response from Groq');
    }
  }

  async generateMenuRecommendations(
    preferences: string,
    menuItems: any[],
    context: ChatContext
  ): Promise<string> {
    const menuText = menuItems
      .map(item => `${item.name} - ${item.description} ($${item.price})`)
      .join('\n');

    const recommendationPrompt = `Based on these preferences: "${preferences}"
    
Here's our menu:
${menuText}

Please recommend 2-3 dishes that would be perfect for someone with these preferences. 
Explain why each recommendation would be a great choice. Keep it conversational and appetizing!`;

    const messages: ChatMessage[] = [
      { role: 'user', content: recommendationPrompt }
    ];

    // Try Groq first (faster), fallback to OpenAI
    try {
      return await this.chatWithGroq(messages, context);
    } catch (error) {
      console.log('Groq failed, trying OpenAI...');
      return await this.chatWithOpenAI(messages, context);
    }
  }

  async getResponse(
    message: string,
    chatHistory: ChatMessage[],
    context: ChatContext
  ): Promise<string> {
    const messages: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: message }
    ];

    // Try Groq first (faster), fallback to OpenAI
    try {
      return await this.chatWithGroq(messages, context);
    } catch (error) {
      console.log('Groq failed, trying OpenAI...');
      return await this.chatWithOpenAI(messages, context);
    }
  }
}

export const chatService = new ChatService();