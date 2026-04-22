# Sistema de Control de Visitas y Clientes

Aplicación web full-stack para gestionar usuarios, clientes y visitas de una empresa.

## Arquitectura

- **Frontend:** React + Vite.
- **Backend:** Node.js + Express.
- **Base de datos:** MongoDB (Mongoose).
- **Autenticación:** JWT (Bearer token).
- **Seguridad API:** Helmet, rate limit, sanitización de payload y validación con Joi.

### Módulos principales

1. **Auth**
   - Registro de usuario.
   - Login.
   - Consulta de perfil actual (`/api/auth/me`).
2. **Clientes (CRUD)**
   - Crear, listar, obtener por id, actualizar y eliminar.
3. **Visitas (CRUD)**
   - Crear, listar, obtener por id, actualizar y eliminar.
   - Relación con cliente y usuario que registró la visita.

## Ejecución local (desarrollo)

### Requisitos

- Node.js 20+
- npm 10+
- MongoDB local o en contenedor

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Por defecto queda en `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Por defecto queda en `http://localhost:5173`.

## Ejecución con Docker (estilo producción)

```bash
docker compose up --build
```

Servicios:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- MongoDB: `mongodb://localhost:27017`

## Variables de entorno

Backend (`backend/.env`):

```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/visits_control
JWT_SECRET=change_me_super_secure
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

## Endpoints API

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Clients
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`

### Visits
- `GET /api/visits`
- `POST /api/visits`
- `GET /api/visits/:id`
- `PUT /api/visits/:id`
- `DELETE /api/visits/:id`

## Recomendaciones para producción

- Configurar secretos fuertes para JWT.
- Configurar HTTPS y reverse proxy (Nginx / Traefik).
- Añadir observabilidad (logs centralizados + métricas).
- Añadir tests automatizados (unitarios e integración).
- Implementar control de roles más granular.

## Subir a GitHub y lanzar la app

Sí, se puede subir a GitHub y desplegarla fácilmente.

### 1) Subir a GitHub

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### 2) CI automática (GitHub Actions)

Se añadió un workflow en `.github/workflows/ci.yml` que:
- instala dependencias de backend y frontend,
- valida sintaxis del backend,
- compila frontend.

Esto se ejecuta automáticamente en cada push/PR.

### 3) Despliegue recomendado (Render + MongoDB Atlas)

1. Crear clúster en **MongoDB Atlas** y copiar URI.
2. En **Render**, crear servicio **Web Service** para `backend/` usando Docker.
3. Configurar variables:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `MONGO_URI=<uri atlas>`
   - `JWT_SECRET=<secreto largo>`
   - `JWT_EXPIRES_IN=1d`
   - `CORS_ORIGIN=<url frontend>`
4. Crear un servicio **Static Site** para `frontend/`.
5. En frontend, definir variable de entorno:
   - `VITE_API_URL=https://TU_BACKEND.onrender.com/api`

### 4) Alternativa simple en un solo servidor

También puedes lanzar todo con `docker compose up --build` en una VM (AWS EC2, DigitalOcean, Azure VM) y publicar puertos con Nginx + HTTPS (Let's Encrypt).
