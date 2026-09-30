import { randomUUID } from "node:crypto";
import type { PaymentResponse, PaymentResult } from "../types/payment.types.js";

export function paymentResponse(body: unknown, result: PaymentResult): PaymentResponse {
  const value = typeof body === "object" && body !== null && !Array.isArray(body)
    ? body as Record<string, unknown> : {};
  const id = randomUUID();
  return {
    ...result,
    id,
    transaction_amount: typeof value.transaction_amount === "number" && Number.isFinite(value.transaction_amount)
      ? value.transaction_amount : null,
    date_created: new Date().toISOString(),
    authorization_code: result.status === "approved" ? randomUUID() : null,
    reference: `SNAIL-${id}`,
    payer_id: typeof value.payer_id === "string" ? value.payer_id : null,
    payer_email: typeof value.payer_email === "string" ? value.payer_email : null,
    // Tarjeta y CVV se devuelven solo por el contrato de esta pasarela ficticia.
    card_number: typeof value.card_number === "string" ? value.card_number : null,
    cvv: typeof value.cvv === "string" ? value.cvv : null,
  };
}
