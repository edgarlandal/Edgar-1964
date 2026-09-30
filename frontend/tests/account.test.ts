import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  applyApprovedPayment,
  endSession,
  hashPassword,
  hasSession,
  readAccount,
  saveAccount,
  startSession,
} from '../src/lib/account.ts'

const data = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  },
})
beforeEach(() => data.clear())

const account = {
  id: 'test-user',
  name: 'Prueba',
  email: 'prueba@example.com',
  passwordHash: 'hash',
  salt: 'salt',
  balance: 0,
}
const approval = {
  id: 'payment-1',
  status: 'approved',
  transaction_amount: 0.1,
  payer_id: account.id,
  payer_email: account.email,
  authorization_code: 'auth-test',
  card_number: '1234123412341234',
  cvv: '543',
}

test('una aprobación guarda saldo y tarjeta ficticia y no se aplica dos veces', () => {
  saveAccount(account)
  startSession(account)
  assert.equal(applyApprovedPayment(account, approval).balance, 0.1)
  assert.equal(readAccount()?.lastPayment?.cvv, '543')
  assert.throws(() => applyApprovedPayment(account, approval))
  assert.equal(
    applyApprovedPayment(account, {
      ...approval,
      id: 'payment-2',
      transaction_amount: 0.2,
    }).balance,
    0.3,
  )
})

test('rechazos, errores y respuestas inválidas no cambian el saldo', () => {
  saveAccount(account)
  startSession(account)
  for (const change of [
    { status: 'rejected' },
    { status: 'error' },
    { payer_id: 'otro' },
    { authorization_code: null },
    { transaction_amount: 1.001 },
    { transaction_amount: -1 },
  ]) {
    assert.throws(() =>
      applyApprovedPayment(account, { ...approval, ...change }),
    )
    assert.equal(readAccount()?.balance, 0)
  }
  endSession()
  assert.throws(() => applyApprovedPayment(account, approval))
  assert.equal(readAccount()?.balance, 0)
})

test('un fallo de almacenamiento no produce una cuenta actualizada', () => {
  saveAccount(account)
  startSession(account)
  const original = localStorage.setItem
  localStorage.setItem = () => {
    throw new Error('Sin espacio')
  }
  try {
    assert.throws(() => applyApprovedPayment(account, approval), /guardar/)
    assert.equal(readAccount()?.balance, 0)
  } finally {
    localStorage.setItem = original
  }
})

test('conserva el saldo y permite cerrar y reabrir la sesión', () => {
  const account = {
    id: 'test-user',
    name: 'Prueba',
    email: 'prueba@example.com',
    passwordHash: 'hash',
    salt: 'salt',
    balance: 100,
  }
  assert.equal(readAccount(), null)
  saveAccount(account)
  startSession(account)
  assert.equal(hasSession(account), true)
  endSession()
  assert.equal(hasSession(account), false)
  assert.equal(readAccount()?.balance, 100)
  startSession(account)
  assert.deepEqual(readAccount(), account)
})

test('la contraseña no se guarda en texto y cambia con la sal', async () => {
  const first = await hashPassword('clave-demo', 'salt-1')
  assert.notEqual(first, 'clave-demo')
  assert.equal(first, await hashPassword('clave-demo', 'salt-1'))
  assert.notEqual(first, await hashPassword('otra-clave', 'salt-1'))
  assert.notEqual(first, await hashPassword('clave-demo', 'salt-2'))
})

test('no carga una cuenta corrupta ni un saldo inválido', () => {
  for (const value of ['{', 'null', '{}', '{"balance":-1}']) {
    data.set('snailpay.account', value)
    assert.throws(() => readAccount())
  }
})
