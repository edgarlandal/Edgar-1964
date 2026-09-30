# Requisitos y estado del proyecto SnailPay

Fecha de revisión: 29 de septiembre de 2026.

Este documento reúne los requisitos de la aplicación, su implementación actual, las decisiones técnicas y el trabajo pendiente para entregar el proyecto. La funcionalidad principal está implementada en el código: acceso local, dashboard y recargas simuladas. Falta completar la revisión de la interfaz, actualizar algunos detalles y preparar la entrega final.

La revisión se basa en la especificación proporcionada y en el código de `frontend` y `backend`. La última comprobación ejecutó 11 pruebas del backend y 6 del frontend, todas correctas. TypeScript, lint del frontend y compilación de producción pasan. Sigue pendiente comprobar el recorrido completo y la presentación en navegador.

## 1 Objetivo y alcance

Construir una aplicación web sencilla con temática de carreras de caracoles. Un usuario puede registrarse, iniciar sesión, consultar su saldo y estadísticas simuladas y cargar saldo mediante SnailPay, una pasarela ficticia.

La aplicación no procesa pagos reales ni ejecuta carreras o apuestas. La autenticación y la persistencia del usuario son locales. El alcance solicitado contempla aproximadamente seis a ocho horas de trabajo dentro de un plazo de siete días calendario; el tiempo real invertido debe registrarlo el autor, no estimarse como un hecho.

### Tecnologías requeridas

- [x] React para la interfaz.
- [x] Express para la API.
- [x] TypeScript en frontend y backend.
- [x] LocalStorage para usuario, sesión y saldo.

Tecnologías adicionales presentes: TanStack Router y Start, Vite, Nitro, Tailwind CSS, shadcn con componentes basados en Base UI y las herramientas de pruebas de Node.js.

## 2 Registro y sesión

| Requisito | Estado | Implementación o evidencia |
| --- | --- | --- |
| Solicitar nombre completo | Implementado | `RegisterForm.tsx`, con validación de nombre no vacío. |
| Solicitar correo electrónico | Implementado | Campo de tipo email y normalización a minúsculas. |
| Solicitar contraseña y confirmación | Implementado | Mínimo de ocho caracteres y comprobación de coincidencia. |
| No solicitar archivos adjuntos | Implementado | Los formularios no incluyen campos de archivos. |
| Acceder después del registro | Implementado | Se guarda la cuenta, se crea la sesión y se navega al dashboard. |
| Cerrar sesión | Implementado | Se elimina la sesión local y se vuelve al acceso. |
| Volver a entrar con correo y contraseña | Implementado | Comparación de correo y hash de contraseña. |
| Conservar información al recargar | Implementado | Lectura del usuario y la sesión desde LocalStorage. |
| Restringir dashboard a una sesión activa | Implementado | Sin cuenta con sesión válida, no se muestra el contenido privado. |
| Iniciar con saldo cero | Implementado | El registro asigna `balance: 0`. |
| Tratar la contraseña de manera razonable | Implementado | PBKDF2 con SHA-256, sal y 100 000 iteraciones; no se guarda la contraseña en texto. |

La cuenta se guarda en `snailpay.account` y la sesión en `snailpay.session`. Esta solución sigue siendo una simulación local: el usuario puede modificar los datos de su navegador y no existe autenticación de servidor.

### Pendientes de acceso

- [x] Conectar `/register` al formulario real y enlazarlo desde el acceso.
- [x] Distinguir la carga inicial de la sesión del estado sin sesión.
- [ ] Comprobar en navegador registro, cierre de sesión, acceso posterior y recarga de página.

## 3 Dashboard y estadísticas

| Requisito | Estado | Implementación o evidencia |
| --- | --- | --- |
| Mostrar nombre del usuario | Implementado | `dashboard.tsx`. |
| Mostrar saldo actual | Implementado | Formato de moneda y actualización del estado tras una recarga. |
| Mostrar donut de apuestas ganadas y perdidas | Implementado | Gráfico CSS con cuatro ganadas y dos perdidas. |
| Mostrar barras de victorias | Implementado | Recharts con datos `wins`, nombres completos, valores y eje numérico en `BarsSnail.tsx`. |
| Incluir seis caracoles | Implementado | Turbo, Rayo, Lento, Baba, Caracolín y Hoja. |
| Representar seis carreras en un día simulado | Implementado | Victorias 2, 1, 0, 1, 2 y 0; suman seis. |
| Permitir cargar saldo | Implementado | `PaymentForm.tsx` dentro del dashboard. |
| Permitir cerrar sesión | Implementado | Acción disponible en el dashboard. |
| Usar datos simulados congruentes | Implementado | Datos fijos, sin ejecución de apuestas ni carreras. |
| Interfaz clara y utilizable | Parcial | Hay componentes y estilos, pero la captura revisada muestra problemas de espacio en pantallas estrechas. |

Las barras utilizan Recharts y el contenedor de gráficos de shadcn; el donut utiliza CSS. Las seis victorias se distribuyen entre seis caracoles.

### Pendientes de presentación

- [ ] Revisar el dashboard a anchos de móvil y escritorio con el código más reciente.
- [ ] Evitar campos comprimidos, texto cortado y gráficos sin espacio suficiente.
- [ ] Mantener separación consistente entre perfil, recarga y estadísticas.
- [ ] Mejorar la identificación de títulos y las leyendas sin introducir un diseño complejo.

## 4 Pasarela simulada SnailPay

SnailPay es una API de Express. El endpoint de recarga es `POST /api/snailpay/payments` y recibe JSON. No se conecta a proveedores de pago reales.

### Datos de entrada

| Campo | Requisito y validación |
| --- | --- |
| `card_number` | Texto de 16 dígitos, sin espacios. Solo datos ficticios. |
| `expiration_date` | Formato MM/AA y mes entre 01 y 12. |
| `cvv` | Texto de tres dígitos. Solo datos ficticios. |
| `cardholder_name` | Nombre no vacío ni compuesto únicamente por espacios. |
| `transaction_amount` | Número finito mayor que cero. El frontend limita a dos decimales. |
| `payer_id` | Identificador no vacío del usuario registrado. |
| `payer_email` | Correo con formato válido del usuario registrado. |

La vigencia real de la fecha no se comprueba para conservar el caso fijo de aprobación `12/26` del mock. Frontend y backend limitan el monto a dos decimales; el backend también comprueba el rango seguro de centavos.

### Escenarios requeridos

| Escenario | Cómo reproducirlo | Resultado esperado | Estado |
| --- | --- | --- | --- |
| Aprobación | Tarjeta 1234123412341234, fecha 12/26, CVV 543, nombre no vacío y monto válido | HTTP 200, estado `approved`, autorización y suma del monto al saldo | Implementado |
| Rechazo de tarjeta | Mantener el formato correcto y cambiar CVV a 000 | HTTP 422, estado `rejected`, motivo específico y saldo sin cambios | Implementado |
| Datos inválidos | CVV de dos dígitos, mes 13 o monto cero | HTTP 400, errores por campo y saldo sin cambios | Implementado |
| Error de sistema | Activar el checkbox o enviar `simulate_error=true` | HTTP 503, estado `error`, sin autorización ni aumento de saldo | Implementado |
| Error de red | Detener el backend e intentar recargar | Mensaje de conexión y saldo sin cambios | Manejo implementado; falta prueba integral de interfaz |
| Timeout | Una solicitud tarda más de diez segundos | Cancelación local y mensaje; no se aplica saldo | Manejo implementado; falta comprobarlo con una respuesta demorada |

Para simular timeout se necesita demorar la respuesta durante una prueba; el checkbox de caída devuelve un error inmediato y no prueba el timeout.

### Respuestas de la API

Los tres resultados de negocio incluyen:

| Campo | Contenido |
| --- | --- |
| `id` | UUID de la operación. |
| `status` | `approved`, `rejected` o `error`. |
| `status_detail` | Mensaje comprensible con los motivos concretos. |
| `transaction_amount` | Monto recibido, o null si no es un número válido para representar. |
| `date_created` | Fecha y hora en formato ISO. |
| `authorization_code` | UUID al aprobar; null en otros resultados. |
| `reference` | Prefijo SNAIL seguido del identificador. |
| `payer_id` | Identificador del usuario, o null si falta o su tipo es incorrecto. |
| `payer_email` | Correo del usuario, o null si falta o su tipo es incorrecto. |
| `card_number` y `cvv` | Datos ficticios recibidos, conforme al contrato del ejercicio. |
| `errors` | Lista con `field`, `code` y `message`; vacía al aprobar. |

### Persistencia y control del saldo

- [x] Solo una aprobación válida permite aplicar una recarga.
- [x] Se comprueba que la respuesta corresponda al usuario y monto enviados.
- [x] Se guarda el saldo en LocalStorage antes de actualizar la pantalla.
- [x] Los rechazos y errores no suman saldo.
- [x] Se muestran mensajes de aprobación y fallo.
- [x] Se bloquea un segundo envío mientras hay una solicitud en curso.
- [x] Se guardan el identificador, tarjeta y CVV ficticios de la última recarga aprobada.
- [ ] Confirmar que conservar solo la última recarga aprobada es el alcance que se declarará; no existe historial de transacciones ni persistencia de intentos rechazados.

## 5 Organización del código

El backend separa responsabilidades en rutas, controlador, servicio, validador, constructor de respuestas, middleware y tipos. El servicio no depende de Express.

El frontend conserva una estructura pequeña: formularios de registro, acceso y pago; `InputCustom` como campo compartido; componentes de shadcn; utilidades locales de cuenta; rutas y gráficos simulados.

### Correcciones y mejoras detectadas

- [x] Corregir el valor predeterminado de `simulateError` a false.
- [x] Completar la ruta de registro.
- [x] Añadir estado de carga inicial del dashboard.
- [x] Actualizar el README del frontend con las rutas y componentes actuales.
- [x] Documentar shadcn, Base UI y Recharts.
- [x] Ejecutar la verificación de tipos y lint sobre la versión final.
- [ ] Revisar dependencias instaladas que no se utilicen antes de entregar.

Estas mejoras no implican que se deba agregar una base de datos, autenticación real ni más capas de arquitectura.

## 6 Pruebas y validación

Existen once pruebas en `backend/tests/snailpay.test.ts` y seis en `frontend/tests/account.test.ts`. Todas pasaron en la última ejecución, incluyendo las nuevas pruebas de precisión monetaria, aprobación, duplicados y fallo de almacenamiento.

### Cobertura existente

- [x] Aprobación y campos principales de la respuesta.
- [x] Rechazo por diferencias de tarjeta, fecha o CVV.
- [x] Caída simulada sin autorización.
- [x] Validaciones de campos, tipos y formato.
- [x] JSON mal formado.
- [x] Mensajes específicos por campo y comparación con la tarjeta ficticia.
- [x] Persistencia local de cuenta y saldo.
- [x] Cierre y reapertura de la sesión local.
- [x] Hash de contraseña y variación con la sal.
- [x] Rechazo de datos locales corruptos.

Estas pruebas se eligieron porque cubren los resultados principales de la integración y la conservación de los datos locales. Las pruebas de almacenamiento no sustituyen pruebas de interacción con los formularios.

### Comprobación final pendiente

- [ ] Registrar un usuario y verificar saldo inicial cero.
- [ ] Cerrar sesión, volver a entrar y recuperar la información.
- [ ] Abrir el dashboard sin sesión y verificar que no muestre sus datos.
- [ ] Aprobar una recarga de 100 y verificar aumento exacto del saldo.
- [ ] Recargar la página y confirmar que el saldo permanece.
- [ ] Rechazar una operación y comprobar saldo sin cambios.
- [ ] Simular caída y comprobar saldo sin cambios.
- [ ] Probar falta de conexión y timeout desde la interfaz.
- [ ] Comprobar errores visibles junto a cada campo.
- [ ] Revisar móvil y escritorio, navegación y ausencia de errores de consola.

## 7 Ejecución local

Requisito de ejecución documentado: Node.js 22.22 o superior y npm.

1. Abrir una terminal en `backend`.
2. Ejecutar `npm install` y después `npm run dev`.
3. Abrir otra terminal en `frontend`.
4. Ejecutar `npm install` y después `npm run dev`.
5. Abrir `http://localhost:3000`.

El backend escucha normalmente en el puerto 3001. El proxy de Nitro, configurado en `frontend/vite.config.ts`, dirige `/api` a `http://127.0.0.1:3001`. Si cambia el destino del backend, se debe actualizar esa configuración.

Para ejecutar las pruebas, usar `npm test` en cada carpeta. Para compilar, usar `npm run build` en cada carpeta. El backend compilado se inicia con `npm start`. El frontend incluye `npm run lint` y `npm run preview`.

## 8 Herramientas y proceso de trabajo

La interfaz partió de una plantilla TanStack. Se adaptaron las pantallas al registro, acceso, dashboard y recarga. Se incorporaron Tailwind CSS y componentes shadcn para campos, tarjetas, etiquetas y botones. Las estadísticas se construyeron con CSS y elementos HTML, sin un motor de carreras.

Codex se utilizó para analizar requisitos, completar la API, separar responsabilidades, integrar el frontend, apoyar las correcciones de estilos, preparar pruebas y documentación. El autor debe revisar y explicar el código y describir en la entrega qué partes adaptó personalmente.

El proceso observado incluyó lectura de la especificación, revisión del código existente, implementación del mock, integración de la interfaz, comprobaciones de tipos y pruebas, y ajustes a partir de capturas y observaciones de uso.

Datos por completar antes de presentar la respuesta final:

- [ ] Tiempo real aproximado invertido.
- [ ] Descripción personal de las adaptaciones realizadas por el autor.
- [ ] Resultado de la última ejecución de pruebas y revisión en navegador.
- [ ] URL pública confirmada del repositorio.
- [ ] URL del despliegue si se realiza la tarea opcional.

## 9 Entregables obligatorios

| Entregable | Estado y acción necesaria |
| --- | --- |
| Código completo | Existe en el espacio de trabajo; guardar los cambios pendientes y publicarlos. |
| Instrucciones de frontend y backend | Existen README; actualizar las referencias desfasadas. |
| Instrucciones de pruebas | Incluidas mediante `npm test` en ambos proyectos. |
| Escenarios reproducibles de SnailPay | Documentados en los README y en este documento. |
| Repositorio público | Pendiente de confirmar acceso público y enlace final. |
| Nombre del repositorio | Ajustar al formato exacto nombre seguido de cuatro cifras; el nombre actual contiene el sufijo API. |
| PDF de respuesta | Generado y revisado visualmente en `output/pdf/Informe_SnailPay.pdf`, con tres páginas y Arial 10. Su fuente editable es `INFORME_ENTREGA.md`. Completar tiempo invertido, aportación personal y confirmación del enlace antes de presentarlo. |

El código y el repositorio deben revisarse para evitar nombres, logotipos o referencias que identifiquen a la empresa evaluadora. El estado de Git revisado mostraba modificaciones y archivos sin seguimiento, incluido el frontend; es necesario incorporarlos a la entrega.

### Formato del PDF de respuesta

- [ ] Fuente Arial de 10 puntos e interlineado estándar.
- [ ] Máximo cuatro páginas para la entrega principal.
- [ ] Sin código fuente, fragmentos de código ni capturas de la aplicación.
- [ ] Resumen del proceso seguido.
- [ ] Decisiones principales.
- [ ] Herramientas, librerías y plantilla utilizadas.
- [ ] Uso de IA y forma de validación.
- [ ] Pruebas implementadas y motivo de su elección.
- [ ] Funcionalidades terminadas.
- [ ] Funcionalidades incompletas y problemas conocidos.
- [ ] Tiempo aproximado invertido.
- [ ] Liga al repositorio público.

Se debe resumir este informe para elaborar el PDF final; no trasladarlo íntegro si supera el límite de páginas. No se deben declarar como terminados los puntos que continúan pendientes.

## 10 Tareas opcionales y elementos fuera de alcance

### Despliegue público opcional

- [ ] Publicar frontend y backend.
- [ ] Configurar el destino real de la API.
- [ ] Incluir URL, plataforma, proceso de publicación y limitaciones.
- [ ] Confirmar acceso sin credenciales adicionales de la plataforma.

Tener un archivo de configuración de despliegue no demuestra que la aplicación esté publicada y operativa.

### Propuesta de base de datos opcional

- [ ] Explicar qué información se almacenaría.
- [ ] Definir entidades o tablas y sus relaciones.
- [ ] Elegir una tecnología y justificarla brevemente.
- [ ] Explicar los cambios necesarios en frontend y backend.

Solo se solicita la propuesta, no implementarla. Cada tarea opcional terminada permite una página adicional en el PDF: cinco páginas con una y seis con ambas.

### Funcionalidades no requeridas

No hace falta implementar recuperación de contraseña, verificación de correo, administración de múltiples usuarios, apuestas reales, ejecución de carreras, una base de datos operativa ni conexión con una pasarela financiera real.

## 11 Orden recomendado para terminar

1. Resolver la ruta de registro y el estado inicial de sesión.
2. Revisar el valor predeterminado de simulación y la coherencia de los montos.
3. Corregir la distribución de la interfaz y comprobar móvil y escritorio.
4. Ejecutar pruebas, tipos y comprobación completa del flujo de usuario.
5. Actualizar README, herramientas utilizadas y problemas conocidos.
6. Guardar y publicar los cambios con el nombre de repositorio requerido.
7. Completar tiempo invertido y aportación personal y elaborar el PDF final.

La prioridad es entregar una aplicación utilizable y una descripción fiel a su estado real. Los extras opcionales deben realizarse después de cerrar el funcionamiento y la entrega principal.
