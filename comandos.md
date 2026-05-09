## Primera instalacion desde cero

Todos los comandos se ejecutan desde la raiz del proyecto.

```powershell
git clone <URL_DEL_REPOSITORIO>
cd Proyecto-HotTime
pnpm install
```

Crear el `.env` del backend:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Crear el `.env` del frontend mobile:

```powershell
Copy-Item apps/frontend-mobile/.env.example apps/frontend-mobile/.env
```

Editar estos valores si hace falta:

```txt
apps/backend/.env
PORT_BACKEND=3001
DATABASE_URL="postgresql://laura:luzhen@localhost:5432/hottime_db"
JWT_SECRET="..."

apps/frontend-mobile/.env
EXPO_PUBLIC_API_BASE_URL="http://TU_IP_LOCAL:3001"
```

Para saber la IP local en Windows:

```powershell
ipconfig
```

Usar la IPv4 de la red WiFi/LAN. Ejemplo:

```txt
http://192.168.1.129:3001
```

Para mobile en un telefono fisico normalmente debe usarse la IP local del ordenador, no `localhost`.

## Base de datos

Arrancar PostgreSQL con Docker:

```powershell
docker compose up -d postgres
```

Generar Prisma Client:

```powershell
pnpm --filter backend exec prisma generate
```

Aplicar migraciones:

```powershell
pnpm --filter backend exec prisma migrate deploy
```

Cargar datos iniciales:

```powershell
pnpm --filter backend exec prisma db seed
```

Si la base de datos ya existia y se quiere reiniciar todo en desarrollo:

```powershell
pnpm --filter backend exec prisma migrate reset --force
```

## Build y comprobacion de TypeScript

```powershell
pnpm build
pnpm --filter frontend-mobile exec tsc -p tsconfig.json
```

## Arrancar el proyecto

Abrir dos terminales en la raiz del proyecto.

Terminal 1:

```powershell
pnpm --filter backend dev
```

Terminal 2:

```powershell
pnpm --filter frontend-mobile dev
```

URLs:

```txt
Backend: http://localhost:3001
Mobile:  Expo mostrara el QR o Metro en http://localhost:8081
```

## Usuarios de prueba

Despues del seed:

```txt
Admin:
email: laurarm1002@gmail.com
password: Password1.

Manager:
email: manager@muerde.com
password: Password1.
```

## Comandos utiles

Ver puertos ocupados:

```powershell
netstat -ano | findstr :3001
netstat -ano | findstr :8081
```

Matar un proceso por PID:

```powershell
taskkill /F /PID <PID>
```

Abrir Prisma Studio:

```powershell
pnpm --filter backend exec prisma studio
```

Formatear schema de Prisma:

```powershell
pnpm --filter backend exec prisma format
```
