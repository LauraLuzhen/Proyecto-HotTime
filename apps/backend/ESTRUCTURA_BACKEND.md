# ESTRUCTURA DEL BACKEND

## 1. Estructura
### De carpetas
/backend
    /prisma
        /migrations
        schema.prisma
        seed.ts
    /src
        /common
        /config
        /lib
            hash.ts
            jwt.ts
        /modules
            /auth
            /user
            /category
        /plugins
            auth.ts
            roles.ts
        app.ts
        server.ts
    .env
    
    package.json
    tsconfig.json

### De carpetas para el /backend/modules
    routes.ts      → HTTP (Fastify)
    service.ts     → lógica
    repository.ts  → Prisma 
    schemas.ts     → Zod

## 2. Puertos (cntr + shift + v)
    BD 5432
    Backend 3001

## 3. BD Postgres y Prisma
### Información general
    🐘 Postgres 16 
    👤 usuario: laura
    🔑 password: luzhen
    📦 database: hottime_db

### Relación E-R
enum Role

🟣 Organization (centro)
    tiene muchos users
    tiene muchas categories
🔵 Category (departamento)
    pertenece a 1 organization
    tiene muchos users
🟢 User (empleado)
    pertenece a 1 organization (obligatorio)
    puede tener category (opcional)
    tiene role fijo

### Datos iniciales (seed.ts)
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