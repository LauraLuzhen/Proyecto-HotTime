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

## 3. Prisma
Datos iniciales en seed.ts:
```ts
Organization
    Muerde la Pasta
    Nervión

Employee
    Muerde la Pasta
        4 user (admin, manager, employee, employee without category)
    Nervión 
        1 user (admin)
    
Category
    Muerde la Pasta
        3 category (cocina, sala, office)
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
Endpoints Auth
| Method | Endpoint              |
|--------|-----------------------|
| POST   | /auth/login           |
| POST   | /auth/forgot-password |
| POST   | /auth/reset-password  |

Endpoints Category
| Method | Endpoint              |
|--------|-----------------------|
| GET    | /categories           | 
| GET    | /categories/:id/users | 
| PUT    | /categories/:id       |
| DELETE | /categories/:id       |

Endpoints User
| Method | Endpoint           |
|--------|--------------------|
| GET    | /users             |
| POST   | /users             |
| DELETE | /users/:id         |
| GET    | /users/me          |
| PUT    | /users/me/password |

## 5. .env
Contenido que debe tener el archivo .env para que el progrmaa funcione correctamente:
```ts
PORT_BACKEND=3001
DATABASE_URL="postgresql://laura:luzhen@localhost:5432/hottime_db"
JWT_SECRET="tfToSeLRHQGxO3IaRlMb3Cd99wAH5BcaFOAH7Z3xkj6kVFox6RzIaxrXF0oyIfK3"
```