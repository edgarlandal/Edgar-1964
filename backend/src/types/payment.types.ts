export interface PaymentInput {
  card_number: string;
  expiration_date: string;
  cvv: string;
  cardholder_name: string;
  transaction_amount: number;
  payer_id: string;
  payer_email: string;
}

export interface PaymentError {
  field: keyof PaymentInput | "body" | "system";
  code: string;
  message: string;
}

export type PaymentStatus = "approved" | "rejected" | "error";

export interface PaymentResult {
  status: PaymentStatus;
  status_detail: string;
  errors: PaymentError[];
}

export interface PaymentResponse extends PaymentResult {
  id: string;
  transaction_amount: number | null;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string | null;
  payer_email: string | null;
  card_number: string | null;
  cvv: string | null;
}
