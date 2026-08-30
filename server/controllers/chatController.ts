import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import { db } from "../services/db.ts";
import { generateGroundedAnswer } from "../services/ragService.ts";
import { Conversation, Message } from "../models/types.ts";

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user!.id;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        success: false,
        message: "Message content cannot be empty.",
      });
      return;
    }

    let conversation: Conversation | undefined;
    let isNewConversation = false;

    if (conversationId) {
      conversation = await db.getConversationById(conversationId);
      if (!conversation || conversation.userId !== userId) {
        res.status(404).json({
          success: false,
          message: "Conversation not found or unauthorized.",
        });
        return;
      }
    } else {
      isNewConversation = true;
      // Generate clean title from question
      const cleanTitle =
        message.trim().length > 45
          ? message.trim().substring(0, 45).replace(/[^\w\s-]/g, "") + "..."
          : message.trim();

      const newConvId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      conversation = {
        id: newConvId,
        userId,
        title: cleanTitle || "New Conversation",
        createdAt: now,
        updatedAt: now,
      };
      await db.createConversation(conversation);
    }

    // Save student's user message
    const userMsgId = `msg_${Date.now()}_user`;
    const userMsg: Message = {
      id: userMsgId,
      conversationId: conversation.id,
      role: "user",
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };
    await db.createMessage(userMsg);

    // Fetch conversation history for multi-turn context
    const previousMessages = await db.getMessagesByConversationId(conversation.id);
    const historyPayload = previousMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Run RAG generation with strict grounding
    const ragResult = await generateGroundedAnswer(message.trim(), historyPayload);

    // Save assistant message
    const assistantMsgId = `msg_${Date.now()}_assistant`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: conversation.id,
      role: "assistant",
      content: ragResult.answer,
      sources: ragResult.sources,
      createdAt: new Date().toISOString(),
    };
    await db.createMessage(assistantMsg);

    // If it was the first turn, ensure title is descriptive
    if (isNewConversation) {
      const refreshedConv = await db.getConversationById(conversation.id);
      if (refreshedConv) {
        conversation = refreshedConv;
      }
    }

    res.json({
      success: true,
      data: {
        conversation,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      },
    });
  } catch (err: any) {
    console.error("[Chat] Send message error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while answering your question. Please try again.",
    });
  }
}

export async function getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const conversations = await db.getConversationsByUserId(userId);
    res.json({
      success: true,
      data: conversations,
    });
  } catch (err: any) {
    console.error("[Chat] getConversations error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve chat conversations.",
    });
  }
}

export async function getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const conversation = await db.getConversationById(id);
    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
      return;
    }

    const messages = await db.getMessagesByConversationId(id);

    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (err: any) {
    console.error("[Chat] getConversation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load conversation details.",
    });
  }
}

export async function updateConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user!.id;

    if (!title || !title.trim()) {
      res.status(400).json({
        success: false,
        message: "Title cannot be empty.",
      });
      return;
    }

    const conversation = await db.getConversationById(id);
    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
      return;
    }

    const updated = await db.updateConversation(id, { title: title.trim() });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error("[Chat] updateConversation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to rename conversation.",
    });
  }
}

export async function deleteConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const conversation = await db.getConversationById(id);
    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
      return;
    }

    await db.deleteConversation(id);

    res.json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  } catch (err: any) {
    console.error("[Chat] deleteConversation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete conversation.",
    });
  }
}
