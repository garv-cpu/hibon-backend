import { Request, Response } from "express";

import { Prompt } from "../../database/models/Prompt.model.js";

export const getTodayPrompt =
  async (
    req: Request,
    res: Response
  ) => {

    const weekday =
      new Date().getDay();

    const prompt =
      await Prompt.findOne({
        weekday,
        active: true
      });

    res.json(prompt);
  };