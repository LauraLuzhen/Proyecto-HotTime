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
    /packages
    package.json
    tsconfig.base.json

## 2. Puertos
    Backend 3001
    Frontend 5173
    BD 5432

## 3. Instalación
    corepack enable
    corepack prepare pnpm@latest --activate


# TODO
General: estructura base
Back: estructura base