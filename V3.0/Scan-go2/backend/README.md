# Backend Scan & Go — Autenticación con Google (Etapa 2)

Documentación breve del registro/inicio de sesión con Google en el backend.
**No cubre frontend, Vercel ni Docker** (fuera del alcance de esta etapa).

## Variable de entorno

```
GOOGLE_CLIENT_ID=<client_id_publico_de_google_oauth>
```

- Se define en `backend/.env` (local) y como placeholder en `backend/.env.example`.
- **No es un secreto** (es un identificador público), pero **no** se versiona un valor real.
- Si está vacía o ausente, `POST /api/auth/google` responde **500** con un mensaje
  controlado de configuración. No se usan valores ficticios.

Variables de CORS (también en `.env.example`):

```
FRONTEND_URL=            # origen(es) de producción, separados por coma
FRONTEND_URL_LOCAL=http://localhost:8000
```

## Endpoint

```
POST /api/auth/google
Content-Type: application/json
```

Cuerpo esperado (**el frontend envía únicamente la credencial de Google**):

```json
{ "credential": "ID_TOKEN_DE_GOOGLE" }
```

El ID token es el que entrega **Google Identity Services** en el cliente.
El backend **no** acepta `nombre`, `email`, `foto_url` ni `google_id` enviados
por el frontend: esos datos se obtienen **solo** del token tras verificarlo.

## Códigos de respuesta

| Código | Significado |
| ------ | ----------- |
| `200`  | Cliente existente autenticado o vinculado correctamente. |
| `201`  | Cliente nuevo registrado con Google. |
| `400`  | Falta `credential` o la solicitud es inválida. |
| `401`  | Token inválido, vencido, con audiencia incorrecta, sin `sub`, sin `email` o con `email_verified !== true`. |
| `409`  | Conflicto: el correo o el `google_id` ya están asociados a otra identidad. |
| `500`  | Error interno controlado (o `GOOGLE_CLIENT_ID` no configurado). No filtra detalles. |

Ejemplo de éxito (`201` en el primer acceso, `200` después):

```json
{
  "ok": true,
  "success": true,
  "message": "Inicio de sesion con Google correcto",
  "cliente": {
    "id": 12,
    "nombre": "Nombre Apellido",
    "dni": null,
    "email": "correo@ejemplo.com",
    "foto_url": "https://lh3.googleusercontent.com/...",
    "google_id": "1234567890"
  }
}
```

## Lógica de identificación (`clienteModel.autenticarConGoogle`)

1. Busca por `google_id`.
   - Si existe: actualiza `nombre`, `email` y `foto_url` con los datos verificados.
2. Si no existe, busca por `email` **o** por el `correo` legado.
   - Si existe y no tiene `google_id`: lo vincula y actualiza `nombre`/`foto_url`,
     **conservando `dni`** y el resto de datos.
   - Si ya tiene otro `google_id`: responde `409`.
3. Si no existe: crea el cliente con `nombre`, `email`, `foto_url`, `google_id`
   y `dni = NULL` (la columna `dni` lo permite). Como `correo` es `NOT NULL`,
   se guarda el email verificado también en `correo`.

Toda la operación es **transaccional**, usa **consultas parametrizadas** y respeta
las restricciones `UNIQUE` de `email` y `google_id` (violaciones `23505` → `409`).

## Verificación de Google vs. sesión interna (importante)

- Esta ruta **verifica la identidad** de Google (firma, audiencia y caducidad del
  ID token) y devuelve el cliente de la base de datos.
- **NO crea una sesión persistente**: el backend **no** usa JWT, cookies ni
  contraseñas. Las futuras rutas protegidas necesitarán su propio mecanismo de
  sesión (que se definirá con su impacto y variables en una etapa posterior).

## Identificación por DNI (Etapa 3)

```
POST /api/clientes/dni
Content-Type: application/json

{ "dni": "99999999" }
```

| Código | Significado |
| ------ | ----------- |
| `200`  | `{ success: true, data: { id, nombre, dni } }` (cliente identificado). |
| `400`  | Falta `dni` o no tiene 8 dígitos. |
| `404`  | `{ success: false, message: "El DNI no esta registrado." }`. |
| `500`  | Error interno controlado. |

Implementación: `src/routes/clienteRoutes.js` → `src/controllers/clienteController.js`
→ `clienteModel.buscarPorDni()` (consulta parametrizada). Solo devuelve `id`,
`nombre` y `dni` (sin datos sensibles).

**Importante:** el DNI **identifica** al cliente dentro del **prototipo académico**;
**no** es autenticación de alta seguridad (no hay contraseña ni token). No se
modificó el modelo ni el flujo previo: solo se añadió esta ruta. La identificación
por DNI **no** sobrescribe `google_id`, `email` ni `foto_url` (esas columnas solo
las escribe la ruta de Google con datos verificados).

## Pendiente

- Conectar **Google Identity Services en el frontend**: el endpoint `POST /api/auth/google`
  ya está preparado en el backend, pero en el frontend (Etapa 3) el botón Google
  muestra "próximamente" y **no** realiza ninguna llamada. Para habilitarlo se
  necesitará `GOOGLE_CLIENT_ID` y enviar el `credential` real de Google.
- Definir el **mecanismo de sesión** para rutas protegidas (no hay JWT ni cookies).
