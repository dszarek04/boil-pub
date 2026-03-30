import { z } from "zod";

export const predecessorRowSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, "Nazwa czynności jest wymagana.")
    .max(20, "Nazwa może mieć maksymalnie 20 znaków."),
  predecessors: z.array(z.string().trim().min(1, "Poprzednik nie może być pusty.")),
  duration: z
    .coerce.number()
    .int("Czas trwania musi być liczbą całkowitą.")
    .positive("Czas trwania musi być większy od 0."),
});

export const predecessorFormSchema = z
  .array(predecessorRowSchema)
  .min(1, "Dodaj co najmniej jedną czynność.");

export const eventSequenceRowSchema = z
  .object({
    id: z.string(),
    name: z
      .string()
      .trim()
      .min(1, "Nazwa czynności jest wymagana.")
      .max(20, "Nazwa może mieć maksymalnie 20 znaków."),
    duration: z
      .coerce.number()
      .int("Czas trwania musi być liczbą całkowitą.")
      .positive("Czas trwania musi być większy od 0."),
    fromNode: z.string().trim().min(1, "Węzeł początkowy jest wymagany."),
    toNode: z.string().trim().min(1, "Węzeł końcowy jest wymagany."),
  })
  .refine((data) => data.fromNode !== data.toNode, {
    message: "Węzeł początkowy i końcowy nie mogą być identyczne.",
    path: ["toNode"],
  });

export const eventSequenceFormSchema = z
  .array(eventSequenceRowSchema)
  .min(1, "Dodaj co najmniej jedną czynność.");

export type PredecessorRowInput = z.infer<typeof predecessorRowSchema>;
export type EventSequenceRowInput = z.infer<typeof eventSequenceRowSchema>;