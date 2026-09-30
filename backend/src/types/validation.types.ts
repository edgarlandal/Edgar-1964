import type { PaymentInput, PaymentError } from "./payment.types.js";

export type ValidationResult =
  | { success: true; data: PaymentInput }
  | { success: false; errors: PaymentError[] };
