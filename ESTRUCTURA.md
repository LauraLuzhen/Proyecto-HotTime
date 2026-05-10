# ESTRUCTURA BASE E INSTALACION
Instalar dependencias pnpm. El proyecto queda como monorepo para que varios companeros trabajemos juntos y la instalacion inicial sea sencilla. En el backend tendremos Prisma + seed para datos iniciales. La carpeta `src` del backend se divide en `lib`, `modules`, `types`, `config`, y los archivos `app.ts` y `server.ts`, todo en TypeScript y Fastify. El frontend sera mobile con Expo/React Native.

## 1. Estructura de carpetas
/proyecto-hottime
    /apps
        /backend
            .env
            package.json
            tsconfig.json
        /frontend-mobile
            .env
            package.json
            tsconfig.json
    /packages
    package.json
    tsconfig.base.json
    .env
    docker-compose.yml
    pnpm-lock.yaml
    pnpm-workspace.yaml

## 2. Puertos
    BD 5432
    Backend 3001
    Mobile 8081

## 3. Instalacion
    corepack prepare pnpm@latest --activate
    docker compose up -d
    backend .env listo
        prueba: pnpm install
    npx prisma migrate reset
    npx prisma migrate dev
    npx prisma generate
    npx prisma db push --force-reset
    npx prisma db push
    npx prisma db seed
        prueba: pnpm dev
        visualizacion BD: npx prisma studio
        formatear schema: npx prisma format
    pnpm --filter @hottime/types build: montar types    
    ctrl + shift + p --> TypeScript: Restart TS Server

pnpm --filter backend dev
pnpm --filter frontend-mobile dev

puertos
netstat -ano | findstr :8081
taskkill /F /PID 1234


problemas
pnpm --filter frontend-mobile exec expo start -c --lan


Reglas de arquitectura recomendadas:
- `routes.ts`: solo parseo HTTP, auth/roles y llamada a servicios.
- `schemas.ts`: Zod de request/response.
- `service.ts`: logica de negocio.
- `repository.ts`: Prisma y SQL raw si hace falta.
