# SnailPay (simulación)

API de recargas ficticias. No realiza cobros reales. Usa exclusivamente datos de prueba.

## Ejecutar

Desde `backend`, con Node.js 22 o superior:

```sh
npm install
npm run dev
```

Escucha en `http://localhost:3001`. Puedes configurar `PORT`.
Para compilar: `npm run build`. Para ejecutar lo compilado: `npm start`.
Para las pruebas: `npm test`.

## Solicitud

`POST /api/snailpay/payments`, con `Content-Type: application/json`:

```json
{
  "card_number": "1234123412341234",
  "expiration_date": "12/26",
  "cvv": "543",
  "cardholder_name": "Usuario de prueba",
  "transaction_amount": 100,
  "payer_id": "user-1",
  "payer_email": "prueba@example.com"
}
```

El nombre y el identificador deben ser textos no vacíos; el correo debe tener formato válido. El monto debe ser un número finito mayor que cero. La tarjeta tiene 16 dígitos, el CVV 3 y la fecha formato MM/AA. Tarjeta y CVV se envían como texto.

Se comprueba el formato de la fecha, no su vigencia real, para conservar el caso fijo `12/26` de esta simulación. El monto admite como máximo dos decimales y debe poder representarse de manera segura en centavos enteros. El servicio no simula una caída salvo que se solicite expresamente.

## Escenarios

| Caso | Cómo reproducirlo | HTTP | status |
| --- | --- | --- | --- |
| Aprobación | Usar el JSON anterior | 200 | approved |
| Rechazo | Cambiar CVV a `000` | 422 | rejected |
| Datos inválidos | Cambiar monto a `0` | 400 | rejected |
| Caída del sistema | Usar `/api/snailpay/payments?simulate_error=true` | 503 | error |
| JSON mal formado | Enviar un JSON incompleto | 400 | rejected |

Las respuestas incluyen `id` (UUID), `status`, `status_detail` (mensaje legible), `transaction_amount`, `date_created` (ISO), `authorization_code` (UUID solo al aprobar; `null` en otros casos), `reference` (`SNAIL-` seguido del id), `payer_id`, `payer_email`, `card_number` y `cvv`. Los valores ausentes o de tipo incorrecto se devuelven como `null`. Los errores de validación agregan `errors`, con campo, código y mensaje. Cada solicitud representa una operación nueva.

## Organización y alcance

La separación de responsabilidades es sencilla y no agrega dependencias:

- `server.ts` inicia el servidor y `app.ts` conecta las rutas y el middleware.
- `controllers/snailpay.controller.ts` recibe la solicitud y elige el código HTTP.
- `services/snailpay.service.ts` coordina la validación y decide si se aprueba o rechaza el pago. No depende de Express.
- `validators/payment.validator.ts` comprueba los datos de entrada y devuelve errores por campo.
- `presenters/payment.presenter.ts` construye la respuesta con identificador, fecha y autorización.
- `middleware/error.middleware.ts` transforma errores de JSON, tamaño e internos en respuestas consistentes.
- `types/payment.types.ts` define el contrato común. Se normalizaron los nombres que tenían puntos repetidos.

## Errores específicos

`errors` siempre es un arreglo; está vacío cuando el pago se aprueba. Cada error contiene `field` (campo), `code` (motivo estable para el frontend) y `message` (explicación legible). `status_detail` resume los motivos concretos, sin obligar a leer el arreglo para saber qué falló.

Por ejemplo, enviar `cvv: "12"` devuelve HTTP 400 e incluye:

```json
{
  "status": "rejected",
  "status_detail": "El CVV debe contener exactamente 3 dígitos.",
  "errors": [
    {
      "field": "cvv",
      "code": "invalid_format",
      "message": "El CVV debe contener exactamente 3 dígitos."
    }
  ]
}
```

Este ejemplo muestra solo los campos de error; la respuesta conserva el resto del contrato.

Se distingue entre campo obligatorio (`required`), tipo incorrecto (`invalid_type`), formato inválido (`invalid_format`), mes inválido (`invalid_month`) y monto no positivo (`must_be_positive`) o no finito (`invalid_number`). Se devuelven todos los campos inválidos juntos.

Si los formatos son correctos pero no coinciden con la tarjeta ficticia, la respuesta es HTTP 422 e indica `card_not_supported`, `expiration_mismatch` o `cvv_mismatch` en el campo correspondiente. Esta comparación solo ocurre después de validar los formatos. Los fallos de JSON usan `field: "body"`; las caídas del servicio usan `field: "system"` y no culpan a los datos del usuario.

La API no tiene base de datos ni persistencia de cobros. El frontend ya conecta el formulario y el dashboard, envía id/correo del usuario y guarda el saldo solo ante una aprobación válida. También maneja errores de red y timeout. Consulta `frontend/README.md` para ejecutar y probar el flujo completo. La última recarga guarda tarjeta y CVV ficticios en LocalStorage; nunca usar datos reales.

Las pruebas verifican aprobación, rechazo, caída simulada, validación y JSON inválido a través de HTTP. Se utilizó Codex para revisar y completar la API, documentar decisiones y crear las pruebas.
