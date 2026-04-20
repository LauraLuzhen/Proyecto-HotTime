# ESTRUCTURA DEL BACKEND

# PUERTOS (cntr + shift + v)
Backend 3001
BD 5432


# ESTRUCTURA
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


# Dependencias
fastify - framework para el servidor se encarga de recibir peticiones HTTP y enviar respuestas
@fastify/cors - plugin de fastify gestiona CORS
@prisma/client - permite utilizar código de BD en los archivos .ts
prisma - permite comandos de administración
zod - librería de validación de esquemas
dotenv - lee los archivos .env
bcrypt - librería para la encriptación de contraseñas


# Desarrollo BD
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