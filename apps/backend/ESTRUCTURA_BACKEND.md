# ESTRUCTURA DEL BACKEND

## 1. Puertos (cntr + shift + v)
    BD 5432
    Backend 3001


# 2. ESTRUCTURA
## De carpetas
/backend
    /src
        /common
        /config
        /lib
        /modules
        /plugins
        app.ts
        server.ts
    .env
    package.json
    tsconfig.json

## De carpetas para el /backend/modules
    routes.ts      → HTTP (Fastify)
    service.ts     → lógica
    repository.ts  → Prisma 
    schemas.ts     → Zod

# 3. BD Postgres y Prisma
## Información general
    🐘 Postgres 16 
    👤 usuario: laura
    🔑 password: luzhen
    📦 database: hottime_db

## Relación E-R
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

## Datos iniciales (seed.ts)
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