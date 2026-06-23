import { z } from "zod";
import { ContactEventSource } from "@prisma/client";

export const RevealPhoneSchema = z.object({
  professionalId: z.string().uuid(),
  source: z.enum(ContactEventSource),
});

export type RevealPhoneInput = z.infer<typeof RevealPhoneSchema>;

export type RevealPhoneActionState = {
  error?: string;
  phone?: string;
};
