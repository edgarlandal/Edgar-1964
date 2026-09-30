import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import app from "../src/app.js";
import { validatePayment } from "../src/validators/payment.validator.js";
import { processPayment } from "../src/services/snailpay.service.js";

test("el servicio no simula una caída por defecto", () => {
  assert.equal(processPayment(payment).status, "approved");
});

test("rechaza montos con precisión inválida o fuera de rango", async () => {
  for (const amount of [1.001, Number.MAX_SAFE_INTEGER]) {
    const { code, body } = await post({ ...payment, transaction_amount: amount });
    assert.equal(code, 400);
    assert.equal(body.authorization_code, null);
    assert.equal(body.errors[0].field, "transaction_amount");
  }
  const { code } = await post({ ...payment, transaction_amount: 0.1 + 0.2 });
  assert.equal(code, 200);
});

const payment = {
  card_number: "1234123412341234",
  expiration_date: "12/26",
  cvv: "543",
  cardholder_name: "Usuario de prueba",
  transaction_amount: 100,
  payer_id: "user-1",
  payer_email: "prueba@example.com",
};
let server: Server;
let url: string;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  url = `http://127.0.0.1:${address.port}/api/snailpay/payments`;
});
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

async function post(body: unknown, query = "") {
  const response = await fetch(url + query, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { code: response.status, body: await response.json() };
}

test("aprueba la tarjeta ficticia y devuelve el contrato completo", async () => {
  const { code, body } = await post(payment);
  assert.equal(code, 200);
  assert.equal(body.status, "approved");
  assert.ok(body.authorization_code);
  assert.ok(body.id);
  assert.equal(body.reference, `SNAIL-${body.id}`);
  assert.ok(Number.isFinite(Date.parse(body.date_created)));
  assert.ok(body.status_detail);
  for (const field of ["transaction_amount", "payer_id", "payer_email", "card_number", "cvv"] as const) {
    assert.equal(body[field], payment[field]);
  }
});

test("rechaza datos de tarjeta diferentes sin autorización", async () => {
  for (const change of [{ card_number: "1111222233334444" }, { cvv: "000" }, { expiration_date: "01/27" }]) {
    const { code, body } = await post({ ...payment, ...change });
    assert.equal(code, 422);
    assert.equal(body.status, "rejected");
    assert.equal(body.authorization_code, null);
  }
});

test("la caída simulada impide aprobar incluso la tarjeta correcta", async () => {
  const { code, body } = await post(payment, "?simulate_error=true");
  assert.equal(code, 503);
  assert.equal(body.status, "error");
  assert.equal(body.authorization_code, null);
  assert.equal(body.transaction_amount, 100);
});

test("valida todos los campos y los tipos de entrada", async () => {
  const invalid = { card_number: "123", expiration_date: "13/26", cvv: "54", cardholder_name: " ", transaction_amount: 0, payer_id: "", payer_email: "sin-correo" };
  const { code, body } = await post(invalid);
  assert.equal(code, 400);
  assert.equal(body.status, "rejected");
  assert.equal(body.authorization_code, null);
  assert.equal(body.errors.length, 7);
  for (const value of [null, [], "texto", 1, undefined]) {
    assert.equal(validatePayment(value).success, false);
  }
  for (const amount of [-1, "100", Infinity, NaN]) {
    assert.equal(validatePayment({ ...payment, transaction_amount: amount }).success, false);
  }
});

test("JSON roto devuelve un error comprensible sin autorización", async () => {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.status, "rejected");
  assert.equal(body.authorization_code, null);
  assert.ok(body.status_detail);
  assert.equal(body.errors[0].field, "body");
  assert.equal(body.errors[0].code, "invalid_json");
});

test("distingue campos ausentes, tipos incorrectos y formatos inválidos", async () => {
  const cases = [
    { change: { cvv: null }, field: "cvv", code: "required" },
    { change: { cvv: 543 }, field: "cvv", code: "invalid_type" },
    { change: { cvv: "54" }, field: "cvv", code: "invalid_format" },
    { change: { expiration_date: "13/26" }, field: "expiration_date", code: "invalid_month" },
    { change: { transaction_amount: "100" }, field: "transaction_amount", code: "invalid_type" },
    { change: { transaction_amount: 0 }, field: "transaction_amount", code: "must_be_positive" },
    { change: { payer_email: "correo" }, field: "payer_email", code: "invalid_format" },
  ];
  for (const scenario of cases) {
    const { code, body } = await post({ ...payment, ...scenario.change });
    assert.equal(code, 400);
    assert.equal(body.errors.length, 1);
    assert.equal(body.errors[0].field, scenario.field);
    assert.equal(body.errors[0].code, scenario.code);
    assert.equal(body.status_detail, body.errors[0].message);
    assert.equal(body.authorization_code, null);
  }
});

test("informa todas las diferencias con la tarjeta ficticia", async () => {
  const { code, body } = await post({ ...payment, card_number: "1111222233334444", expiration_date: "01/27", cvv: "000" });
  assert.equal(code, 422);
  assert.deepEqual(body.errors.map((error: { field: string; code: string }) => [error.field, error.code]), [
    ["card_number", "card_not_supported"],
    ["expiration_date", "expiration_mismatch"],
    ["cvv", "cvv_mismatch"],
  ]);
  for (const error of body.errors) assert.ok(body.status_detail.includes(error.message));
  assert.equal(body.authorization_code, null);
});

test("un CVV incorrecto explica el motivo concreto en español", async () => {
  const { body } = await post({ ...payment, cvv: "12" });
  assert.equal(body.status_detail, "El CVV debe contener exactamente 3 dígitos.");
});

test("la caída simulada no se confunde con un fallo de validación", async () => {
  const { code, body } = await post({}, "?simulate_error=true");
  assert.equal(code, 503);
  assert.equal(body.errors[0].field, "system");
  assert.equal(body.errors[0].code, "service_unavailable");
  assert.equal(body.authorization_code, null);
});
