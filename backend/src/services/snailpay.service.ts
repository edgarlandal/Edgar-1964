import type { PaymentError, PaymentResult } from "../types/payment.types.js";
import { validatePayment } from "../validators/payment.validator.js";

const APPROVED_CARD = {
  card_number: "1234123412341234",
  expiration_date: "12/26",
  cvv: "543",
};

function reject(errors: PaymentError[]): PaymentResult {
  return {
    status: "rejected",
    status_detail: errors.map((error) => error.message).join(" "),
    errors,
  };
}

export function processPayment(
  body: unknown,
  simulateError = false,
): PaymentResult {
  // Una caída simulada tiene prioridad: ninguna solicitud puede aprobarse.
  if (simulateError) {
    return {
      status: "error",
      status_detail: "SnailPay no está disponible. Intenta de nuevo más tarde.",
      errors: [
        {
          field: "system",
          code: "service_unavailable",
          message: "El servicio de pagos está temporalmente fuera de servicio.",
        },
      ],
    };
  }

  const validation = validatePayment(body);
  if (!validation.success) return reject(validation.errors);

  const payment = validation.data;
  const errors: PaymentError[] = [];
  if (payment.card_number !== APPROVED_CARD.card_number) {
    errors.push({
      field: "card_number",
      code: "card_not_supported",
      message:
        "El número de tarjeta no corresponde a la tarjeta de prueba admitida.",
    });
  }
  if (payment.expiration_date !== APPROVED_CARD.expiration_date) {
    errors.push({
      field: "expiration_date",
      code: "expiration_mismatch",
      message: "La fecha de vencimiento no coincide con la tarjeta de prueba.",
    });
  }
  if (payment.cvv !== APPROVED_CARD.cvv) {
    errors.push({
      field: "cvv",
      code: "cvv_mismatch",
      message: "El CVV no coincide con la tarjeta de prueba.",
    });
  }
  if (errors.length) return reject(errors);

  return { status: "approved", status_detail: "Recarga aprobada.", errors: [] };
}
