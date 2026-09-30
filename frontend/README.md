# Frontend SnailPay

Interfaz con React y TypeScript basada en la plantilla TanStack existente. Utiliza Tailwind CSS, componentes shadcn con Base UI y Recharts para las barras. El donut usa CSS.

## Ejecutar localmente

Con Node.js 22.22 o superior, abre dos terminales:

```sh
cd backend
npm install
npm run dev
```

```sh
cd frontend
npm install
npm run dev
```

Abre http://localhost:3000. El frontend envía las solicitudes /api al backend en el puerto 3001 mediante el proxy de Nitro configurado en vite.config.ts. Si cambias el puerto del backend, actualiza ese archivo.

## Funcionalidades

- Registro de un usuario local, contraseña de al menos 8 caracteres y confirmación.
- Inicio y cierre de sesión; recuperación de sesión y saldo al recargar.
- Saldo inicial de $0, nombre y correo del usuario.
- Recarga con errores por campo, bloqueo de envíos repetidos y timeout de 10 segundos.
- Solo las aprobaciones válidas actualizan el saldo; primero se guarda y después se actualiza la pantalla.
- Donut con 4 apuestas ganadas y 2 perdidas. Seis caracoles con 6 victorias totales simuladas.

## Probar pagos

Crea una cuenta y usa tarjeta ficticia `1234123412341234`, fecha `12/26`, CVV `543`, nombre y monto positivo.

- Aprobación: recarga 100; el saldo debe aumentar 100 y persistir al recargar o cerrar e iniciar sesión.
- Rechazo: cambia el CVV a `000`; aparece el motivo y el saldo no cambia.
- Validación: usa CVV `12`, fecha `13/26` o monto `0`; los errores aparecen junto a los campos.
- Sistema: activa “Simular caída de SnailPay”; no aumenta el saldo.
- Red: detén el backend e intenta recargar; no aumenta el saldo.
- Registro: prueba contraseñas distintas, correo inválido e inicio de sesión incorrecto.

## Archivos principales

- `src/routes/index.tsx`: inicio de sesión.
- `src/routes/register.tsx`: registro.
- `src/routes/dashboard.tsx`: perfil, saldo y distribución adaptable.
- `src/components/BarsSnail.tsx`: barras de seis caracoles y donut de apuestas.
- `src/components/PaymentForm.tsx`: formulario y conexión con SnailPay.
- `src/lib/account.ts`: LocalStorage y hash de contraseña.
- `src/styles.css`: estilos mínimos.

La cuenta se guarda en `snailpay.account` y la sesión en `snailpay.session`. Solo se admite una cuenta por navegador. PBKDF2 con sal evita guardar la contraseña en texto; el acceso sigue siendo una simulación local. La última recarga conserva la tarjeta y el CVV ficticios como pide el contrato del mock. No uses datos reales.

`npm test` ejecuta seis pruebas de persistencia, sesión, contraseña, aprobación, duplicados y fallos de almacenamiento. `npm run build` compila el proyecto; `npm run lint` revisa el código. La comprobación visual e interacción completa debe realizarse con los pasos anteriores.

El monto admite hasta dos decimales tanto en frontend como en backend. Los rechazos y errores nunca se aplican al saldo. Se guarda solo la última recarga aprobada, no un historial. La aplicación es una simulación local y no ofrece sincronización transaccional entre recargas simultáneas en varias pestañas.

El proxy apunta al backend local en 127.0.0.1:3001. Para publicar con el backend en otro servidor, hay que actualizar ese destino. Esta entrega no configura hosting.

Se utilizó Codex para implementar el flujo, simplificar la plantilla y realizar las comprobaciones.
