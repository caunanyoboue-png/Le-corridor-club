import { ZodError } from "zod";

/** Converts a ZodError to a human-readable string */
export function zodMessage(err: ZodError): string {
  return err.issues.map((i) => i.message).join(" · ");
}
