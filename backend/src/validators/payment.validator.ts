import type { PaymentError, PaymentInput } from "../types/payment.types.js";
import type { ValidationResult } from "../types/validation.types.js";

export function validatePayment(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { success: false, errors: [{
      field: "body", code: "invalid_body", message: "El cuerpo debe ser un objeto JSON.",
    }] };
  }

  const input = value as Record<string, unknown>;
  const errors: PaymentError[] = [];
  const addError = (field: keyof PaymentInput, code: string, message: string) => {
    errors.push({ field, code, message });
  };

  function requiredText(field: keyof PaymentInput, label: string): string {
    const value = input[field];
    if (value === undefined || value === null || value === "") {
      addError(field, "required", `${label} es obligatorio.`);
    } else if (typeof value !== "string") {
      addError(field, "invalid_type", `${label} debe enviarse como texto.`);
    } else if (!value.trim()) {
      addError(field, "required", `${label} no puede contener solo espacios.`);
    } else {
      return value;
    }
    return "";
  }

  const card_number = requiredText("card_number", "El número de tarjeta");
  const expiration_date = requiredText("expiration_date", "La fecha de vencimiento");
  const cvv = requiredText("cvv", "El CVV");
  const cardholder_name = requiredText("cardholder_name", "El nombre completo");
  const payer_id = requiredText("payer_id", "El identificador del usuario");
  const payer_email = requiredText("payer_email", "El correo");

  if (card_number && !/^\d{16}$/.test(card_number)) {
    addError("card_number", "invalid_format", "El número de tarjeta debe contener exactamente 16 dígitos, sin espacios.");
  }
  if (expiration_date) {
    if (!/^\d{2}\/\d{2}$/.test(expiration_date)) {
      addError("expiration_date", "invalid_format", "La fecha de vencimiento debe tener formato MM/AA.");
    } else if (Number(expiration_date.slice(0, 2)) < 1 || Number(expiration_date.slice(0, 2)) > 12) {
      addError("expiration_date", "invalid_month", "El mes de vencimiento debe estar entre 01 y 12.");
    }
  }
  // El calendario real no invalida la fecha fija 12/26 de esta simulación.
  if (cvv && !/^\d{3}$/.test(cvv)) {
    addError("cvv", "invalid_format", "El CVV debe contener exactamente 3 dígitos.");
  }
  if (payer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer_email)) {
    addError("payer_email", "invalid_format", "El correo debe tener un formato válido, por ejemplo usuario@example.com.");
  }

  const transaction_amount = input.transaction_amount;
  if (transaction_amount === undefined || transaction_amount === null) {
    addError("transaction_amount", "required", "El monto de la recarga es obligatorio.");
  } else if (typeof transaction_amount !== "number") {
    addError("transaction_amount", "invalid_type", "El monto debe enviarse como número, sin comillas.");
  } else if (!Number.isFinite(transaction_amount)) {
    addError("transaction_amount", "invalid_number", "El monto debe ser un número finito.");
  } else if (transaction_amount <= 0) {
    addError("transaction_amount", "must_be_positive", "El monto de la recarga debe ser mayor que cero.");
  } else if (!Number.isSafeInteger(Math.round(transaction_amount * 100))) {
    addError("transaction_amount", "amount_too_large", "El monto supera el límite permitido.");
  } else if (Math.abs(transaction_amount * 100 - Math.round(transaction_amount * 100)) > 0.000001) {
    addError("transaction_amount", "invalid_precision", "El monto debe tener como máximo 2 decimales.");
  }

  if (errors.length || typeof transaction_amount !== "number") {
    return { success: false, errors };
  }
  return { success: true, data: {
    card_number, expiration_date, cvv, cardholder_name,
    transaction_amount, payer_id, payer_email,
  } };
}
