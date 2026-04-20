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
        prueba: pnpm dev
    


# TODO
General: estructura base ✅
Back: estructura base ✅
Back: bd postgres + docker ✅
Back: prisma + schema ✅
Back: seed datos iniciales
Back: token hash passwords
Back: middleware JWT (protección de rutas)
