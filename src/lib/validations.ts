import { z } from "zod";

const password = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .max(72, "A senha é muito longa")
  .regex(/[A-Za-z]/, "A senha deve conter letras")
  .regex(/\d/, "A senha deve conter números");

const phone = z
  .string()
  .min(10, "Informe um telefone válido")
  .max(15)
  .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Telefone inválido");

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});

export const clientRegisterSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome").max(120),
    email: z.string().email("E-mail inválido").toLowerCase(),
    phone,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const shopRegisterSchema = z
  .object({
    // owner
    name: z.string().min(2).max(120),
    email: z.string().email().toLowerCase(),
    phone,
    password,
    confirmPassword: z.string(),
    // company
    companyName: z.string().min(2, "Informe o nome da salão").max(120),
    slug: z
      .string()
      .min(3)
      .max(60)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens"),
    whatsapp: phone.optional().or(z.literal("")),
    address: z.string().min(3).max(200),
    city: z.string().min(2).max(80),
    state: z.string().min(2).max(2),
    planId: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  price: z.coerce.number().min(0).max(100000),
  durationMin: z.coerce.number().int().min(5).max(480),
  imageUrl: z.string().url().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export const professionalSchema = z.object({
  name: z.string().min(2).max(120),
  photoUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email().toLowerCase().optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  specialties: z.array(z.string()).default([]),
  bio: z.string().max(500).optional(),
  commissionRate: z.coerce.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true),
  serviceIds: z.array(z.string()).default([]),
});

export const appointmentSchema = z.object({
  companyId: z.string().min(1),
  professionalId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  notes: z.string().max(500).optional(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  phone: phone.optional().or(z.literal("")),
  whatsapp: phone.optional().or(z.literal("")),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(2).optional(),
  workingHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        openTime: z.string().regex(/^\d{2}:\d{2}$/),
        closeTime: z.string().regex(/^\d{2}:\d{2}$/),
        enabled: z.boolean(),
      })
    )
    .default([]),
  minAdvanceHours: z.coerce.number().int().min(0).max(720).default(4),
  minRescheduleHours: z.coerce.number().int().min(0).max(720).default(2),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
