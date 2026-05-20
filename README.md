# HotTime

> Aplicación móvil multiplataforma para gestión de horarios y control de fichajes en empresas y organizaciones.

---

## Índice

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Credenciales por defecto](#credenciales-por-defecto)
- [Puertos](#puertos)
- [Comandos disponibles](#comandos-disponibles)
- [Arquitectura del backend](#arquitectura-del-backend)
- [Solución de problemas](#solución-de-problemas)

---

## Descripción

HotTime es una aplicación móvil (Android e iOS) orientada al control de fichajes y gestión de horarios de empleados. Permite:

- Gestión de turnos (CRUD) con estados: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `MISSED`
- Fichaje de entrada y salida con validación de ubicación GPS
- Sistema de roles: **admin**, **manager** y **employee**
- Comunicados internos dirigidos a usuarios, categorías o toda la organización
- Agenda de contactos integrada y reuniones vía Google Meet
- Panel de administración para gestión de usuarios y categorías

El proyecto está estructurado como **monorepo** con `pnpm workspaces`, con un paquete de tipos compartidos entre backend y frontend.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend mobile | React Native + Expo (TypeScript) |
| Backend | Fastify + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Autenticación | JWT |
| Validación | Zod |
| Contenedores | Docker + Docker Compose |
| Gestor de paquetes | pnpm (monorepo) |

---

## Estructura del proyecto

```
/hottime
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── lib/          # Utilidades puras (hash, JWT, errores HTTP)
│   │   │   ├── plugins/      # Plugins de Fastify (auth, roles)
│   │   │   ├── types/        # Declaraciones de tipos globales
│   │   │   └── modules/      # Módulos por entidad (attendance, auth, category…)
│   │   │       └── [modulo]/
│   │   │           ├── routes.ts     # Endpoints HTTP + auth/roles
│   │   │           ├── service.ts    # Lógica de negocio
│   │   │           ├── repository.ts # Acceso a BD con Prisma
│   │   │           └── schemas.ts    # Validación con Zod
│   │   ├── app.ts
│   │   └── server.ts
│   └── frontend-mobile/
│       ├── assets/               # Logo e iconos de la aplicación
│       ├── src/
│       │   ├── components/       # Componentes reutilizables de UI
│       │   ├── hooks/            # Hooks personalizados (ej. useRefresh)
│       │   ├── img/              # Imágenes estáticas de la aplicación
│       │   ├── lib/
│       │   │   ├── api.ts        # Cliente HTTP centralizado (llamadas al backend)
│       │   │   ├── styles.ts     # Estilos globales compartidos
│       │   │   ├── profile.ts    # Funciones auxiliares de perfil de usuario
│       │   │   └── schedule.ts   # Funciones auxiliares del calendario de turnos
│       │   ├── navigation/       # Configuración de la barra de navegación
│       │   ├── screens/          # Pantallas de la aplicación
│       │   └──state/
│       │       ├── AuthContext.ts   # Contexto global de autenticación
│       │       └── AuthProvider.tsx # Proveedor del contexto de autenticación
│       ├── .env
│       ├── app.json
│       ├── App.tsx
│       └── index.js
├── packages/
│   └── types/                # DTOs, entidades y funciones compartidas
│       └── src/modules/      # attendance, auth, category, communication…
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Requisitos previos

Antes de clonar y ejecutar el proyecto, asegúrate de tener instalado:

- **Node.js** v18 o superior
- **pnpm** v9 o superior
- **Docker Desktop** (en ejecución)
- **Git**
- Editor recomendado: **Visual Studio Code**

> Para instalar o activar pnpm con corepack:
> ```bash
> corepack prepare pnpm@latest --activate
> ```

---

## Instalación y puesta en marcha

Sigue estos pasos **en orden**:

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyecto-hottime
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Levantar la base de datos con Docker

```bash
docker compose up -d
```

Esto levanta un contenedor PostgreSQL en el puerto `5432`.

### 4. Configurar variables de entorno

Crea los archivos `.env` en las carpetas indicadas (ver sección [Variables de entorno](#variables-de-entorno)):

- `apps/backend/.env`
- `apps/frontend-mobile/.env`

### 5. Inicializar la base de datos

```bash
pnpm setup
pnpm db:reset
```

Este comando ejecuta internamente:
```bash
pnpm --filter backend exec prisma migrate reset --force --skip-seed
pnpm --filter backend exec prisma generate
pnpm --filter backend exec prisma db push --force-reset
pnpm --filter backend exec prisma db seed
```

### 6. Compilar los tipos compartidos

```bash
pnpm build
```

> Si el editor no reconoce los tipos tras el build, reinicia el servidor de TypeScript en VSCode:
> `Ctrl + Shift + P` → **TypeScript: Restart TS Server**

### 7. Arrancar los servicios

En terminales separadas (o con el comando conjunto):

```bash
# Backend
pnpm backend

# Frontend mobile
pnpm frontend
```

---

## Variables de entorno

### `apps/backend/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hottime"
JWT_SECRET="tu_clave_secreta_jwt"
PORT=3001
```

### `apps/frontend-mobile/.env`

```env
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

> En modo tunnel o dispositivo físico, sustituye `localhost` por la IP local de tu máquina.

---

## Credenciales por defecto

Las siguientes credenciales son insertadas automáticamente por el seed de Prisma al ejecutar `pnpm db:reset`:

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@hottime.com` | `Admin1234!` |
| Manager | `manager@hottime.com` | `Manager1234!` |
| Employee | `employee@hottime.com` | `Employee1234!` |

> Las contraseñas se almacenan hasheadas en la base de datos. Estas credenciales son exclusivamente para entorno de desarrollo y pruebas.

---

## Puertos

| Servicio | Puerto |
|---|---|
| PostgreSQL | `5432` |
| Backend (Fastify) | `3001` |
| Frontend mobile (Expo) | `8081` |

---

## Comandos disponibles

### Scripts principales del monorepo

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala todas las dependencias del monorepo |
| `pnpm setup` | Instalación completa (dependencias + Docker + BD + build) |
| `pnpm build` | Compila el paquete de tipos compartidos |
| `pnpm db:reset` | Resetea y recrea la BD con migraciones y seed |
| `pnpm backend` | Arranca el backend en modo desarrollo |
| `pnpm frontend` | Arranca el frontend mobile con Expo |
| `pnpm frontend:tunnel` | Arranca el frontend en modo tunnel (dispositivo físico) |

### Comandos de Prisma (manual)

```bash
# Resetear BD completa
pnpm --filter backend exec prisma migrate reset --force --skip-seed

# Generar cliente Prisma
pnpm --filter backend exec prisma generate

# Empujar esquema a la BD
pnpm --filter backend exec prisma db push --force-reset

# Ejecutar seed
pnpm --filter backend exec prisma db seed

# Abrir Prisma Studio (visualización de BD)
cd ./apps/backend
npx prisma studio

# Formatear schema.prisma
cd ./apps/backend
npx prisma format
```

### Comandos de Expo (manual)

```bash
# Arrancar con caché limpia
pnpm --filter frontend-mobile exec expo start -c

# Arrancar en modo tunnel con caché limpia
pnpm --filter frontend-mobile exec expo start -c --tunnel
```

### Utilidades de red (Windows)

```bash
# Verificar si el puerto 8081 está en uso
netstat -ano | findstr :8081

# Matar proceso por PID
taskkill /F /PID <PID>
```

---

## Arquitectura del backend

El backend sigue una arquitectura modular por capas. Cada módulo (entidad) contiene exactamente cuatro archivos:

```
routes.ts     → Parseo HTTP, autenticación y control de roles
schemas.ts    → Validación de request/response con Zod
service.ts    → Lógica de negocio
repository.ts → Acceso a BD mediante Prisma (y SQL raw si es necesario)
```

Los módulos implementados son: `auth`, `user`, `category`, `organization`, `planning` (turnos), `attendance` (fichajes) y `communication` (comunicados).

---

## Solución de problemas

**El frontend no conecta con el backend en dispositivo físico o emulador:**
Sustituye `localhost` en `EXPO_PUBLIC_API_URL` por la IP local de tu máquina (ej. `192.168.1.X`). Alternativamente, usa el modo tunnel: `pnpm frontend:tunnel`.

**El servidor de TypeScript no reconoce los tipos compartidos:**
Ejecuta `pnpm build` para compilar el paquete de tipos y luego reinicia el servidor TS en VSCode: `Ctrl + Shift + P` → **TypeScript: Restart TS Server**.

**Puerto 8081 ocupado:**
```bash
netstat -ano | findstr :8081
taskkill /F /PID <PID>
```

**Problemas con la caché de Expo:**
```bash
pnpm --filter frontend-mobile exec expo start -c
```

**Error al conectar con la base de datos:**
Verifica que Docker Desktop esté en ejecución y el contenedor activo:
```bash
docker compose up -d
docker ps
```