# ESTRUCTURA BASE E INSTALACIÓN
Instalar dependencias pnpm, quiero que sea un monorepo para que varios compañeros trabajemos conjunto y la instalacion inicial no se muy coñazo sino q sea poner un par de comandos. en el backend tendremos prisma + seed que serán los datos inicialias. tengrá una carpet src la cual los archivos se dividirán en lib, modules, types, config y dos archivos app.ts y server.ts todo esto con .ts y Fastify. El frontend será con React y Vite. 

## 1. Estructura de carpetas
/proyecto-hottime
    /apps
        /backend
            .env
            package.json
            tsconfig.json
        /frontend
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
    Frontend 5173

## 3. Instalación
    corepack enable
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
        visualización BD: npx prisma studio
        formatear schema: npx prisma format
    pnpm --filter @hottime/types build: montar types 

pnpm --filter backend dev
pnpm --filter frontend-web dev
pnpm --filter frontend-mobile dev


puertos
netstat -ano | findstr :8080
taskkill /F /PID 1234


