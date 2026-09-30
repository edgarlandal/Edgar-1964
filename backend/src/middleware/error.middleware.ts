import type { ErrorRequestHandler } from "express";
import { paymentResponse } from "../presenters/payment.presenter.js";

export const handleError: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const type = error && typeof error === "object" ? error.type : undefined;
  const invalidJson = type === "entity.parse.failed";
  const tooLarge = type === "entity.too.large";
  const message = invalidJson
    ? "El cuerpo contiene JSON inválido. Revisa las comillas, comas y llaves."
    : tooLarge
      ? "El cuerpo de la solicitud supera el límite de 100 KB."
      : "Ocurrió un error interno al procesar la recarga. Intenta de nuevo más tarde.";

  res.status(invalidJson ? 400 : tooLarge ? 413 : 500).json(
    paymentResponse(req.body, {
      status: invalidJson || tooLarge ? "rejected" : "error",
      status_detail: message,
      errors: [
        {
          field: invalidJson || tooLarge ? "body" : "system",
          code: invalidJson
            ? "invalid_json"
            : tooLarge
              ? "payload_too_large"
              : "internal_error",
          message,
        },
      ],
    }),
  );
};
