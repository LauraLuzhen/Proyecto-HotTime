## AUTH
LogIn POST - /auth/login ✅
{
    "email": "laurarm1002@gmail.com",
    "password": "Password1."
}
ForgotPassword POST - /auth/forgot-password ✅
{
    "email": "laurarm1002@gmail.com"
}
ResetPassword POST - /auth/reset-password ✅
{
    "resetToken": resetToken,
    "password": newPassword
}

## USER
LogIn
Get me GET - /users/me ✅
Get users GET - /users ✅
    filtros
        /users?fullName=juan
        /users?role=ADMIN
        /users?categoryId=2
Get users all + me GET - /users/all ✅
Get user by id GET - /users/:id ✅
Create user by admin POST - /users ✅
{
    "fullName": "Juan Perez",
    "email": "juan@test.com",
    "password": "Test1234!",
    "role": "EMPLOYEE",
    "birthDate": "2000-01-01",
    "phone": "123456789",
    "categoryId": [1]
}
Delete user by admin DELETE - /users/:id ✅
Update me PATCH - /users/me ✅
{
    "fullName": "Nuevo Nombre",
    "phone": "987654321"
}
Update user by admin PATCH - /users/:id ✅
{
    "fullName": "Empleado Actualizado",
    "email": "nocat@muerde.com",
    "password": "Password2.",
    "birthDate": "1996-04-04",
    "phone": "611111111",
    "imgProfile": null,
    "role": "MANAGER",
    "initDate": "2025-01-03",
    "categoryId": [2]
}

## CATEGORY
LogIn
Get categories GET - /categories ✅
Get users by category GET - /categories/2/users ✅
Create category by admin POST - /categories ✅
{
  "name": "Nueva categoria"
}
Update category by admin PATCH - /categories/:id ✅
{
  "name": "Cocina nueva"
}
Delete category by admin DELETE - /categories/:id ✅

## COMMUNICATION
LogIn
Create communication POST - /communications ✅
{
    "title": "Aviso importante 1",
    "content": "Mantenimiento del sistema esta noche",
    "type": "GENERAL"
}
Get comunicados mensajes GET - /communications/inbox ✅
Get comunicados enviados GET - /communications/inbox?read=true ✅
Get comunicados no leídos GET - /communications/inbox?read=false ✅
Get comunicados leídos GET - /communications/outbox ✅
Get comunicado por id GET - /communications/:id ✅
Get comunicado count leídos GET - /communications/inbox/count/read ✅
Get comunicado count no leídos GET - /communications/inbox/count/unread ✅

## ORGANIZATION
LogIn
Get organization GET - /organization ✅
Update organization PATCH - /organization ✅
{
  "name": "Muerde la Pasta",
  "latitude": 37.3890924,
  "longitude": -5.9844589,
  "allowedRadiusMeters": 150
}

## HORARIO / PLANNING
### SHIFTS
LogIn
Create shift POST - /planning/shifts/user ✅
{
  "userId": 2,
  "startsAt": "2026-05-11T21:00:00+02:00",
  "endsAt": "2026-05-11T21:00:00+02:00",
  "published": true
}
Create shift POST - /planning/shifts/users ✅
{
  "userIds": [2, 3, 4],
  "startsAt": "2026-05-11T20:00:00+02:00",
  "endsAt": "2026-05-11T21:00:00+02:00",
  "published": true
}
Create shift POST - /planning/shifts/category ✅
{
  "categoryId": 1,
  "startsAt": "2026-05-11T20:00:00+02:00",
  "endsAt": "2026-05-11T21:00:00+02:00",
  "published": true
}
Para crear shift igual a todos los users sin category -> `"categoryId": null`
Get all GET - /planning/shifts ✅
Get por id user GET - /planning/shifts?userId=1 ✅
Get por published - /planning/shifts?published=false ✅
Get por category - /planning/shifts?categoryId=3 ✅
Get por startsFrom o endsFrom - /planning/shifts?startsFrom=2026-05-01&startsTo=2026-05-31 ✅
Get calendar me GET - /planning/shifts/calendar ✅
Get calendar userid GET - /planning/shifts/calendar?userId=4 ✅
Get solo next shift GET - /planning/shifts/calendar?includeNext=true&includeWeek=false&includeMonth=false ✅
Get solo next shift by user GET - /planning/shifts/calendar?userId=4&includeNext=true&includeWeek=false&includeMonth=false ✅
Get full calendar GET - /planning/shifts/calendar?includeNext=true&includeWeek=true&includeMonth=true ✅
Get fecha referencia GET - /planning/shifts/calendar?date=2026-05-10 ✅
Update por id un shift PATCH - /planning/shifts/2 ✅
Delete por id un shift DELETE - /planning/shifts/2 ✅
  al borrar el shift se eliminan también sus attendances
{
  "startsAt": "2026-05-11T20:00:00+02:00",
  "endsAt": "2026-05-11T21:00:00+02:00",
  "status": "IN_PROGRESS",
  "published": true
}

### ATTENDANCE
LogIn
Create clockin POST - /planning/attendance/clock-in
{
  "shiftId": 10,
  "latitude": 37.3890924,
  "longitude": -5.9844589
}
Create clockout POST - /planning/attendance/clock-out
{
  "shiftId": 10,
  "latitude": 37.3890924,
  "longitude": -5.9844589
}
Create attendance POST - /planning/attendance
{
  "shiftId": 10,
  "type": "CLOCK_IN",
  "occurredAt": "2026-05-11T20:00:00+02:00"
}
Get list attendance GET - /planning/attendance
  /planning/attendance
  /planning/attendance?userId=2
  /planning/attendance?shiftId=10
  /planning/attendance?type=CLOCK_IN
  /planning/attendance?from=2026-05-11T20:00:00+02:00&to=2026-05-11T21:00:00+02:00
Get calendar attendance GET - /planning/attendance/calendar
Get week attendance GET - /planning/attendance/week
Get month attendance GET - /planning/attendance/month
Get by id GET - /planning/attendance/:attendanceId
Update attendance PATCH - /planning/attendance/:attendanceId
{
  "shiftId": 10,
  "type": "CLOCK_OUT",
  "occurredAt": "2026-05-11T20:00:00+02:00"
}
Delete attendance DELETE - /planning/attendance/:attendanceId

**Notas importantes**
- `shiftId` debe existir.
- El `userId` no se manda en el body: se toma automáticamente del `shift`.
- En `clock-in` y `clock-out`, el `shift` tiene que pertenecer al usuario autenticado.
- En el CRUD manual, `ADMIN` y `MANAGER` pueden trabajar con attendances de su organización.
- En planning, `ADMIN` y `MANAGER` gestionan turnos; `EMPLOYEE` ve solo sus calendarios.
