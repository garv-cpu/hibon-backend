import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(),

  password: z
    .string()
    .min(6)
    .max(100)
});

export const loginSchema = z
  .object({
    identifier: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(120)
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .optional(),

    password: z
      .string()
      .min(6)
  })
  .refine(
    (data) =>
      Boolean(data.identifier || data.email),
    {
      message: "Email or username is required",
      path: ["identifier"]
    }
  );
