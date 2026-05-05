import { z } from "zod";
import type { CreateUserDto } from "@hottime/types";

// CREATE
export const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "A capital letter")
    .regex(/[a-z]/, "A lowercase")
    .regex(/[0-9]/, "A number")
    .regex(/[^A-Za-z0-9]/, "A special character"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  birthDate: z.coerce.date().refine((date) => date < new Date()),
  phone: z.string().length(9).regex(/^\d+$/),
  categoryId: z.number().int().positive().nullable().default(null),
});
export type CreateUserInput = CreateUserDto;

// GET
export const getUserIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export const getUsersSchema = z.object({
  fullName: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  categoryId: z.coerce.number().optional(),
}).strict();

// UPDATE
export const updateMeSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "A capital letter")
    .regex(/[a-z]/, "A lowercase")
    .regex(/[0-9]/, "A number")
    .regex(/[^A-Za-z0-9]/, "A special character")
    .optional(),
  birthDate: z.coerce.date().refine((date) => date < new Date()).optional(),
  phone: z.string().length(9).regex(/^\d+$/).optional(),
  imgProfile: z.string().nullable().optional(),
});
export const updateUsersSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "A capital letter")
    .regex(/[a-z]/, "A lowercase")
    .regex(/[0-9]/, "A number")
    .regex(/[^A-Za-z0-9]/, "A special character")
    .optional(),
  birthDate: z.coerce.date().refine((date) => date < new Date()).optional(),
  phone: z.string().length(9).regex(/^\d+$/).optional(),
  imgProfile: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  initDate: z.coerce.date().refine((d) => d < new Date()).optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
});
