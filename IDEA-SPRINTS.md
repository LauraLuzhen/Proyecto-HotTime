# IDEA DE LA APLICACIÓN Y ORGANIZACIÓN POR SPRINTS
## 1. Idea de la aplicación
### Pestañas (Sidebar)
- Usuario (T)
- Contactos (T)
- Comunicado (2,3) -> a superiores / empleados 
    a superiores
        - general 
        - pedir días *
        - pedir vacaciones * 
        - falta de asistencia 
        - baja temporal *
        - baja permanente * 
    a empleados
        - general
        - falta de personal
- Bandeja notificaciones / comunicados (1,2)
- Horario / Registro o historial de fichajes anteriores (T)
- Hacer horario (1,2)
- QR o btn (1,2)

### Dashboard
- Categorías
- Organización
- Fichaje -> aviso antes de entrar
- Horario semanal
- Próximas vacaciones

### Plus
Cálculo de horas
Contrato
Salario y pluses (nocturnidades, festivos)
Nómina

## 2. Sprints 🔴🟡🟢
### TODO: Sprint 1
- General: estructura base ✅
- Back: estructura base ✅
- Back: bd postgres + docker ✅
- Back: prisma + schema ✅
- Back: seed datos iniciales ✅
- Back: hash passwords ✅
- Back: login api ✅
- Back: middleware JWT (protección de rutas) ✅
- Back: permisos por roles ✅
- Back: modules crud user 
    - LogIn, LogOut, Reset password ✅
    - Crud user to me ✅
    - Crud user to users ✅
- Back: modules crud category ✅
- Back: app.ts mejorado ❌
- General: types aplicarlo al backend ✅
- Front: login page and dashboard page ✅
- Front: permisos por roles ✅

### TODO: Sprint 2
- Back: comunicado bd y backend

- My user page
- Contactos page
- Comunicado page
- Horario page 

### TODO: Sprint 3
- Fichaje page
- QR page

### TODO: Sprint 4
- Aplicar Fichaje a Comunicado
- Mejorar QR

### TODO: Sprint 5
- Mejoras de la aplicación / visual
- Cálculo de horas page (+)

### TODO: Sprint 6
- Contrato page (+)
- Salario + pluses (nocturnidades, festivos, etc) (+)
- Nómina (+)