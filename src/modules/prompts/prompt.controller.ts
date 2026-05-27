import { Request, Response } from "express";

import { Prompt } from "../../database/models/Prompt.model.js";

let cachedPrompt:
  | {
      dateKey: string;
      prompt: unknown;
    }
  | null = null;

export const getTodayPrompt =
  async (
    req: Request,
    res: Response
  ) => {

    const now = new Date();
    const dateKey =
      now.toISOString().slice(0, 10);

    if (
      cachedPrompt &&
      cachedPrompt.dateKey === dateKey
    ) {
      res.json({
        success: true,
        data: cachedPrompt.prompt
      });
      return;
    }

    const prompts =
      await Prompt.find({
        active: true
      })
        .sort({
          weekday: 1,
          createdAt: 1
        })
        .lean();

    if (!prompts.length) {
      res.json({
        success: true,
        data: null
      });
      return;
    }

    const dayIndex =
      now.getDate() % prompts.length;
    const selected =
      prompts[dayIndex];
    const prompt = {
      _id: selected._id.toString(),
      text: selected.text,
      category:
        selected.festival || selected.title,
      language: "en"
    };

    cachedPrompt = {
      dateKey,
      prompt
    };

    res.json({
      success: true,
      data: prompt
    });
  };
