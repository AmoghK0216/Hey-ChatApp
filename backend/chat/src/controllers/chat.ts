import type { Response } from "express";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Chat } from "../model/Chat.js";
import { Message } from "../model/Message.js";
import axios from "axios";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({
        message: "other userId is required",
      });
      return;
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

    if (existingChat) {
      res.json({
        message: "Chat already exists",
        chatId: existingChat._id,
      });
      return;
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "Chat created successfully",
      chatId: newChat._id,
    });
  },
);

export const getAllChats = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    if (!userId) {
      res.status(400).json({
        message: "User ID missing or not found",
      });
      return;
    }

    const chats = await Chat.find({
      users: userId,
    }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id !== userId);
        const unseenCount = await Message.countDocuments({
          _id: chat._id,
          sender: { $ne: userId },
          seen: false,
        });

        try {
          const { data } = await axios.get(
            `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
          );

          return {
            user: data,
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          };
        } catch (error) {
          console.log(error);
          return {
            user: {
              _id: otherUserId,
              name: "Unknown User",
            },
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage,
              unseenCount,
            },
          };
        }
      }),
    );

    res.json({
      chats: chatWithUserData,
    });
  },
);
