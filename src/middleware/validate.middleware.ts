import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors =
        result.error.flatten().fieldErrors;
      const firstMessage =
        Object.values(fieldErrors)
          .flat()
          .find(Boolean);

      return res.status(400).json({
        success: false,
        message:
          firstMessage ||
          "Please check your details",
        errors: fieldErrors
      });
    }

    req.body = result.data;

    next();
  };
