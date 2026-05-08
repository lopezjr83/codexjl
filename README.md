# Sistema de Control de Visitas — Control de Visitas SPADD

Aplicación web full-stack para gestionar visitantes, clientes y proveedores en instalaciones empresariales.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 (SPA) |
| Backend | Node.js 20 + Express 4 |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JWT (Bearer token) |
| Almacenamiento de fotos | Google Drive (Service Account) |
| Despliegue | Vercel (frontend + backend serverless) |
| Seguridad | Helmet, rate-limit, mongo-sanitize, Joi |

---

## Funcionalidades

### Operación diaria
- Registro de entradas: Visita / Cliente / Proveedor
- Captura de foto del DPI al registrar (comprimida y subida a Google Drive)
- Tarjetas de visitas activas en tiempo real con badge de tarjeta
- Dar salida con un click desde las tarjetas activas
- Modal de detalle al hacer click en el histórico
- Filtros en el histórico: búsqueda, categoría, rango de fechas

### Dashboard operativo
- Monitoreo en vivo: tabla de personas actualmente en sitio
- Alerta visual para visitas con más de 120 minutos en sitio
- KPIs: visitas activas, salidas del día, proveedores dentro, tiempo promedio
- Resumen diario por categoría
- Últimas 8 salidas del día

### Reportes (solo admin)
- 7 KPIs calculados sobre el conjunto filtrado
- Filtros: búsqueda de texto, categoría, estatus, rango de fechas
- Tabla ordenable por cualquier columna
- Exportación a CSV con todos los campos

### Administración
- Gestión de usuarios (crear, editar, activar/desactivar, resetear contraseña)
- Configuración de tipos de visita (etiqueta y color por categoría)
- Sistema de permisos por módulo (dashboard, operación, reportes, usuarios)
- Logs de auditoría por acción

### Perfil de usuario
- Edición de nombre, email y teléfono
- Cambio de contraseña con validación de contraseña actual

---

## Arquitectura del proyecto

```
codexjl/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── pages/         # Dashboard, Operations, Reports, Profile, Admin
│   │   ├── components/    # AppShell, DpiCapture, Panels de admin/perfil
│   │   ├── api/           # http.js (fetch wrapper con auth)
│   │   ├── contexts/      # AuthContext
│   │   └── styles/        # app.css (design system con variables CSS)
│   └── vercel.json        # Rewrite rules para SPA
│
└── backend/               # Express serverless
    ├── api/
    │   └── index.js       # Entry point para Vercel (bodyParser: false)
    ├── src/
    │   ├── controllers/   # visit, client, user, auth, report, audit
    │   ├── models/        # Visit, Client, User, AuditLog, VisitTypeConfig
    │   ├── routes/        # Express routers
    │   ├── middleware/     # auth, validate, asyncHandler, error
    │   ├── utils/         # audit.js, validators.js, driveUpload.js
    │   ├── config/        # env.js
    │   └── bootstrap/     # ensureOwnerUser.js
    ├── vercel.json        # Catch-all route → api/index.js
    └── .env.example
```

---

## Variables de entorno

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/visits_control
JWT_SECRET=change_me_super_secure
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173,https://tu-frontend.vercel.app
CORS_ORIGIN_SUFFIXES=.vercel.app,.spadd.net

# Usuario dueño (se crea automáticamente al iniciar)
OWNER_AUTOCREATE=true
OWNER_SYNC_PASSWORD=true
OWNER_PASSWORD=your_secure_password_here

# Google Drive — fotos DPI
GOOGLE_DRIVE_FOLDER_ID=<id_de_la_carpeta_drive>
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
VITE_APP_VERSION=1.0.0
```

---

## Ejecución local

### Requisitos
- Node.js 20+, npm 10+
- MongoDB local o cuenta de MongoDB Atlas

### Backend
```bash
cd backend
cp .env.example .env
# Edita .env con tus valores
npm install
npm run dev
# → http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Despliegue en Vercel (producción actual)

El proyecto se despliega en **dos proyectos Vercel separados**, ambos del mismo repositorio GitHub.

### 1. Backend (proyecto `codexjl`)

1. Importar repo → **Root Directory**: `backend`
2. Variables de entorno requeridas:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | URI de MongoDB Atlas |
| `JWT_SECRET` | String largo y aleatorio |
| `JWT_EXPIRES_IN` | `1d` |
| `CORS_ORIGIN` | URL del frontend |
| `CORS_ORIGIN_SUFFIXES` | `.vercel.app,.spadd.net` |
| `OWNER_AUTOCREATE` | `true` |
| `OWNER_SYNC_PASSWORD` | `true` |
| `OWNER_PASSWORD` | Contraseña del admin |
| `GOOGLE_DRIVE_FOLDER_ID` | ID de la carpeta de Drive |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON completo de la cuenta de servicio |

> **Nota importante:** Al agregar/modificar variables de entorno en Vercel, es necesario hacer un **Redeploy** para que tomen efecto.

### 2. Frontend (proyecto visitas-frontend)

1. Importar mismo repo → **Root Directory**: `frontend`
2. Variables:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://codexjl.vercel.app/api` |
| `VITE_APP_VERSION` | `1.0.0` |

---

## Integración con Google Drive

Las fotos del DPI se suben automáticamente a una carpeta de Google Drive en lugar de guardarse como base64 en MongoDB.

### Configuración

1. Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar la **Google Drive API**
3. Crear una **cuenta de servicio** y descargar el JSON de credenciales
4. Compartir la carpeta de Drive con el email de la cuenta de servicio (rol Editor)
5. Configurar las variables `GOOGLE_DRIVE_FOLDER_ID` y `GOOGLE_SERVICE_ACCOUNT_JSON` en Vercel

### Comportamiento
- Si el upload a Drive falla (timeout, credenciales inválidas), la foto se guarda como base64 de respaldo en MongoDB
- Los archivos se nombran: `Categoria_Tarjeta_Nombre_YYYY-MM-DD_HH-mm.jpg`
- Los archivos son públicamente legibles (se puede mostrar en `<img>`)

---

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil actual |
| PUT | `/api/auth/me` | Actualizar perfil |
| PUT | `/api/auth/me/password` | Cambiar contraseña |

### Visitas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/visits` | Listar (filtros: status, category, dateFrom, dateTo) |
| POST | `/api/visits` | Crear visita + upload foto a Drive |
| GET | `/api/visits/:id` | Detalle |
| PUT | `/api/visits/:id` | Actualizar |
| DELETE | `/api/visits/:id` | Eliminar |
| PUT | `/api/visits/:id/check-in` | Registrar entrada |
| PUT | `/api/visits/:id/check-out` | Registrar salida |

### Clientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clients` | Listar |
| POST | `/api/clients` | Crear |
| GET | `/api/clients/:id` | Detalle |
| PUT | `/api/clients/:id` | Actualizar |
| DELETE | `/api/clients/:id` | Eliminar |

### Usuarios (solo admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| PUT | `/api/users/:id/reset-password` | Resetear contraseña |

### Reportes y auditoría (solo admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reports/visits.csv` | Exportar visitas en CSV |
| GET | `/api/audit-logs` | Logs de auditoría |

### Configuración de tipos de visita
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/visit-types` | Obtener configuración |
| PUT | `/api/visit-types` | Actualizar etiquetas y colores |

---

## Usuario administrador por defecto

Al iniciar el backend por primera vez, se crea automáticamente:

- **Email:** `lopezjr@spadd.net`
- **Rol:** `admin`
- **Contraseña:** definida en `OWNER_PASSWORD`

Para desactivar la creación automática: `OWNER_AUTOCREATE=false`

---

## Notas de producción

- El backend corre como **función serverless en Vercel** (máx. 10s por request en plan hobby)
- El body parser de Vercel está **deshabilitado** (`bodyParser: false`) para permitir que Express maneje cuerpos de hasta 5MB (fotos base64)
- Los errores de Mongoose (ValidationError, CastError) devuelven HTTP 400
- Todos los endpoints protegidos requieren header `Authorization: Bearer <token>`
- CORS configurado para aceptar múltiples orígenes y sufijos de dominio
