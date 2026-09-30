export interface Account {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  balance: number
  lastPayment?: { id: string; card_number: string; cvv: string }
}

const KEY = 'snailpay.account'
const SESSION = 'snailpay.session'

export function readAccount(): Account | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  const account = JSON.parse(raw) as Account | null
  if (
    !account ||
    typeof account.id !== 'string' ||
    typeof account.name !== 'string' ||
    typeof account.email !== 'string' ||
    typeof account.passwordHash !== 'string' ||
    typeof account.salt !== 'string' ||
    !Number.isFinite(account.balance) ||
    account.balance < 0
  ) {
    throw new Error('Los datos guardados del usuario no son válidos.')
  }
  return account
}

export function saveAccount(account: Account) {
  localStorage.setItem(KEY, JSON.stringify(account))
}

export function hasSession(account: Account) {
  return localStorage.getItem(SESSION) === account.id
}

export function startSession(account: Account) {
  localStorage.setItem(SESSION, account.id)
}

export function endSession() {
  localStorage.removeItem(SESSION)
}

export function applyApprovedPayment(
  account: Account,
  payment: {
    id: string
    status: string
    transaction_amount: number
    payer_id: string
    payer_email: string
    authorization_code: string | null
    card_number: string
    cvv: string
  },
): Account {
  const current = readAccount()
  if (!current || current.id !== account.id || !hasSession(current)) {
    throw new Error(
      'La sesión cambió. Inicia sesión nuevamente; no se agregó saldo.',
    )
  }
  if (
    payment.status !== 'approved' ||
    !payment.authorization_code ||
    !payment.id ||
    payment.payer_id !== current.id ||
    payment.payer_email !== current.email ||
    !Number.isFinite(payment.transaction_amount) ||
    payment.transaction_amount <= 0
  ) {
    throw new Error(
      'La operación no es una aprobación válida. El saldo no cambió.',
    )
  }
  if (current.lastPayment?.id === payment.id)
    throw new Error('Esta operación ya fue aplicada.')
  // Se suman centavos enteros para evitar acumulaciones de error decimal.
  const cents = Math.round(payment.transaction_amount * 100)
  const total = Math.round(current.balance * 100) + cents
  if (
    !Number.isSafeInteger(total) ||
    Math.abs(payment.transaction_amount * 100 - cents) > 0.000001
  ) {
    throw new Error(
      'El monto supera el límite o contiene más de dos decimales.',
    )
  }
  const updated = {
    ...current,
    balance: total / 100,
    lastPayment: {
      id: payment.id,
      card_number: payment.card_number,
      cvv: payment.cvv,
    },
  }
  try {
    saveAccount(updated)
  } catch {
    throw new Error(
      'No se pudo guardar la recarga en este navegador. El saldo local no cambió.',
    )
  }
  return updated
}

// PBKDF2 evita guardar la contraseña en texto. La sesión sigue siendo una simulación local.
export async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
