# ESTRUCTURA BACKEND

## 1. Introducción
- Fastify
- Prisma
- PostgreSQL
- JWT
- Zod

### Puertos
- BD 5432
- Backend 3001

## 2. Estructura
```ts
/backend
    /prisma
        /migrations
        schema.prisma
        seed.ts
    /src
        /lib
            hash.ts
            jwt.ts
        /modules
            /auth
            /category
            /user
        /plugins
            auth.ts
            roles.ts
        app.ts
        server.ts
    .env
    package.json
    tsconfig.jason
```

## 4. Carpeta /src

### /lib
Utilidades puras con funcionalidades reutilizables y sin dependencias de Fastify.

### /plugins
Extensiones de Fastify.

### /modules
Estructura de cada carpeta de modules:
```ts
routes.ts      → HTTP (Fastify)
service.ts     → lógica
repository.ts  → Prisma 
schemas.ts     → Zod
```