import type { Request, Response } from "express";
import { processPayment } from "../services/snailpay.service.js";
import { paymentResponse } from "../presenters/payment.presenter.js";

const transactionErrors = new Set(["card_not_supported", "expiration_mismatch", "cvv_mismatch"]);

export function createPayment(req: Request, res: Response): void {
  const result = processPayment(req.body, req.query.simulate_error === "true");
  let httpStatus = 200;
  if (result.status === "error") {
    httpStatus = 503;
  } else if (result.status === "rejected") {
    httpStatus = result.errors.some(error => transactionErrors.has(error.code)) ? 422 : 400;
  }
  res.status(httpStatus).json(paymentResponse(req.body, result));
}
