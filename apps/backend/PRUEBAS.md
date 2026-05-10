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
Get comunicados enviardos GET - /communications/inbox?read=true ✅
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
  "startsAt": "2026-05-12T09:00:00.000Z",
  "endsAt": "2026-05-12T17:00:00.000Z",
  ("published": true)
}
Create shift POST - /planning/shifts/users  ✅
{
  "userIds": [2, 3, 4],
  "startsAt": "2026-05-13T09:00:00.000Z",
  "endsAt": "2026-05-13T17:00:00.000Z",
  ("published": true)
}
Create shift POST - /planning/shifts/category  ✅
{
  "categoryId": 1, 
  "startsAt": "2026-05-14T09:00:00.000Z",
  "endsAt": "2026-05-14T17:00:00.000Z",
  ("published": true)
}
Para crear shift igual a todos los users sin category -> "categoryId": null 
Get all GET - /planning/shifts ✅
Get por id user GET - /planning/shifts?userId=1 ✅
Get por published - /planning/shifts?published=false ✅
Get por category - /planning/shifts?categoryId=3 ✅
Get por startsFrom o endsFrom - /planning/shifts?startsFrom=2026-05-01&startsTo=2026-05-31 ✅
Get calendar me GET - /planning/shifts/calendar ✅
Get calendar userid GET - /planning/shifts/calendar?userId=4 ✅
Get solo next shift GET - /planning/shifts/calendar?includeNext=true&includeWeek=false&includeMonth=false ✅
Get full calendar GET - /planning/shifts/calendar?includeNext=true&includeWeek=true&includeMonth=true ✅
Get fecha referencia GET - /planning/shifts/calendar?date=2026-05-10 ✅

 






























































Create shift POST - /planning/shifts
Permitido: ADMIN, MANAGER
Body:
{
  "userId": 2,
  "categoryId": 1,
  "startsAt": "2026-05-11T09:00:00.000Z",
  "endsAt": "2026-05-11T17:00:00.000Z",
  "published": true
}
Notas:
- categoryId es opcional y puede ser null.
- published por defecto es false si no se envia.
- startsAt debe ser anterior a endsAt.
- No puede solaparse con otro turno no cancelado del mismo user.
Errores controlados:
- 400 VALIDATION_ERROR: body invalido.
- 400 INVALID_SHIFT_RANGE: startsAt >= endsAt.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.
- 403 CATEGORY_FORBIDDEN: categoryId no pertenece a tu organization.
- 404 USER_NOT_FOUND: usuario no existe.
- 404 CATEGORY_NOT_FOUND: categoria no existe.
- 409 SHIFT_OVERLAP: el usuario ya tiene un turno que se solapa.

Create shifts bulk POST - /planning/shifts/bulk
Permitido: ADMIN, MANAGER
Body para algunos users:
{
  "userIds": [2, 3, 4],
  "categoryId": 1,
  "startsAt": "2026-05-12T09:00:00.000Z",
  "endsAt": "2026-05-12T17:00:00.000Z",
  "published": true
}
Body para todos los users de la organization:
{
  "allUsers": true,
  "categoryId": null,
  "startsAt": "2026-05-13T09:00:00.000Z",
  "endsAt": "2026-05-13T17:00:00.000Z",
  "published": false
}
Notas:
- Usa userIds o allUsers, no ambos.
- Si algun user tiene solape, no se crea el bloque.
Errores controlados:
- 400 VALIDATION_ERROR: body invalido.
- 400 INVALID_USER_SELECTION: userIds y allUsers enviados a la vez.
- 400 NO_USERS_SELECTED: no hay usuarios seleccionados.
- 400 INVALID_SHIFT_RANGE: startsAt >= endsAt.
- 403 USER_FORBIDDEN: uno o mas users no pertenecen a tu organization.
- 403 CATEGORY_FORBIDDEN: categoryId no pertenece a tu organization.
- 409 SHIFT_OVERLAP: algun usuario ya tiene un turno que se solapa.

Get shifts GET - /planning/shifts
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/shifts
    /planning/shifts?from=2026-05-01T00:00:00.000Z&to=2026-06-01T00:00:00.000Z
    /planning/shifts?userId=2
    /planning/shifts?userIds=2,3,4
    /planning/shifts?categoryId=1
    /planning/shifts?status=SCHEDULED
    /planning/shifts?published=true
Notas:
- ADMIN/MANAGER pueden filtrar por userId, userIds, categoryId, status, published, from, to.
- EMPLOYEE ignora el resto y solo puede ver lo suyo; si intenta pedir otro user da error.
- El rango busca turnos que cruzan el intervalo: startsAt < to y endsAt > from.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 400 INVALID_DATE_RANGE: from >= to.
- 400 INVALID_USER_FILTERS: se envia userId y userIds a la vez.
- 403 PLANNING_FORBIDDEN: employee intenta ver planning de otro user.
- 403 USER_FORBIDDEN: userId/userIds no pertenecen a tu organization.
- 403 CATEGORY_FORBIDDEN: categoryId no pertenece a tu organization.

Get next shift GET - /planning/shifts/next
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/shifts/next
    /planning/shifts/next?userId=2
Notas:
- Devuelve el proximo turno publicado con status SCHEDULED o IN_PROGRESS y endsAt futuro.
- Sin userId devuelve el proximo turno del usuario logueado.
- EMPLOYEE solo puede pedir su propio proximo turno.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 403 PLANNING_FORBIDDEN: employee intenta ver otro user.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.

Get week shifts GET - /planning/shifts/week
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/shifts/week
    /planning/shifts/week?userId=2
Notas:
- Semana actual de lunes a domingo.
- EMPLOYEE solo puede ver su semana.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 403 PLANNING_FORBIDDEN: employee intenta ver otro user.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.

Get month shifts GET - /planning/shifts/month
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/shifts/month
    /planning/shifts/month?userId=2
Notas:
- Mes actual completo.
- EMPLOYEE solo puede ver su mes.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 403 PLANNING_FORBIDDEN: employee intenta ver otro user.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.

Get shift by id GET - /planning/shifts/:id
Permitido: ADMIN, MANAGER, EMPLOYEE con permisos
Ejemplo:
    /planning/shifts/10
Notas:
- ADMIN/MANAGER pueden ver cualquier turno de su organization.
- EMPLOYEE solo puede ver un turno suyo.
Errores controlados:
- 400 VALIDATION_ERROR: id invalido.
- 403 PLANNING_FORBIDDEN: employee intenta ver turno de otro user.
- 404 SHIFT_NOT_FOUND: turno no existe o no pertenece a tu organization.

Update shift PATCH - /planning/shifts/:id
Permitido: ADMIN, MANAGER
Body ejemplo:
{
  "userId": 2,
  "categoryId": 1,
  "startsAt": "2026-05-11T10:00:00.000Z",
  "endsAt": "2026-05-11T18:00:00.000Z",
  "actualStartsAt": null,
  "actualEndsAt": null,
  "status": "SCHEDULED",
  "published": true
}
Body para cancelar:
{
  "status": "CANCELLED"
}
Notas:
- Todos los campos son opcionales.
- status acepta: SCHEDULED, IN_PROGRESS, COMPLETED, MISSED, CANCELLED.
- No deja mover el turno si solapa con otro del mismo user.
- No deja cambiar userId si el turno ya tiene fichajes.
- Para completar manualmente debe existir clock-in o actualStartsAt.
Errores controlados:
- 400 VALIDATION_ERROR: body o id invalido.
- 400 INVALID_SHIFT_RANGE: startsAt >= endsAt.
- 400 INVALID_ACTUAL_RANGE: actualStartsAt > actualEndsAt.
- 400 CLOCK_IN_REQUIRED: intenta completar sin entrada.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.
- 403 CATEGORY_FORBIDDEN: categoryId no pertenece a tu organization.
- 404 SHIFT_NOT_FOUND: turno no existe o no pertenece a tu organization.
- 409 SHIFT_OVERLAP: el cambio solapa con otro turno.
- 409 SHIFT_HAS_ATTENDANCE: intenta cambiar userId con fichajes ya creados.

Delete shift DELETE - /planning/shifts/:id
Permitido: ADMIN, MANAGER
Ejemplo:
    /planning/shifts/10
Notas:
- Solo borra turnos sin fichajes.
- Si ya hay fichajes, cancelar con PATCH status CANCELLED.
Errores controlados:
- 400 VALIDATION_ERROR: id invalido.
- 404 SHIFT_NOT_FOUND: turno no existe o no pertenece a tu organization.
- 409 SHIFT_HAS_ATTENDANCE: no se borra porque tiene registros reales.

### ATTENDANCE / FICHAJE

Clock in POST - /planning/attendance/clock-in
Permitido: ADMIN, MANAGER, EMPLOYEE, solo turno propio
Body:
{
  "shiftId": 10,
  "latitude": 37.3890924,
  "longitude": -5.9844589
}
Body con fecha manual opcional:
{
  "shiftId": 10,
  "latitude": 37.3890924,
  "longitude": -5.9844589,
  "occurredAt": "2026-05-11T09:02:00.000Z"
}
Notas:
- Crea Attendance CLOCK_IN.
- Pone Shift status IN_PROGRESS.
- Rellena actualStartsAt.
- El turno debe estar published=true.
- Solo deja fichar entrada desde 1 hora antes de startsAt hasta endsAt.
- La ubicacion debe estar dentro del radio configurado en /organization.
Errores controlados:
- 400 VALIDATION_ERROR: body invalido.
- 400 ORGANIZATION_LOCATION_NOT_CONFIGURED: la organizacion no tiene latitud, longitud o radio.
- 400 SHIFT_NOT_PUBLISHED: turno no publicado.
- 403 ATTENDANCE_FORBIDDEN: intenta fichar turno de otro user.
- 403 ATTENDANCE_LOCATION_OUT_OF_RANGE: fuera del radio permitido.
- 404 SHIFT_NOT_FOUND: turno no existe o no pertenece a tu organization.
- 409 SHIFT_NOT_CLOCKABLE: turno CANCELLED, MISSED o COMPLETED.
- 409 CLOCK_IN_NOT_AVAILABLE: aun no esta cerca del inicio o ya paso el turno.
- 409 CLOCK_IN_ALREADY_EXISTS: ya tiene entrada.
- 409 CLOCK_OUT_ALREADY_EXISTS: ya tiene salida.

Clock out POST - /planning/attendance/clock-out
Permitido: ADMIN, MANAGER, EMPLOYEE, solo turno propio
Body:
{
  "shiftId": 10,
  "latitude": 37.3890924,
  "longitude": -5.9844589
}
Body con fecha manual opcional:
{
  "shiftId": 10,
  "latitude": 37.3890924,
  "longitude": -5.9844589,
  "occurredAt": "2026-05-11T17:03:00.000Z"
}
Notas:
- Crea Attendance CLOCK_OUT.
- Pone Shift status COMPLETED.
- Rellena actualEndsAt.
- Debe existir CLOCK_IN antes.
- Puede fichar salida antes de endsAt si ya tiene entrada.
- La ubicacion debe estar dentro del radio configurado en /organization.
Errores controlados:
- 400 VALIDATION_ERROR: body invalido.
- 400 CLOCK_IN_REQUIRED: no hay entrada previa.
- 400 INVALID_ATTENDANCE_RANGE: salida anterior a entrada.
- 400 ORGANIZATION_LOCATION_NOT_CONFIGURED: la organizacion no tiene latitud, longitud o radio.
- 403 ATTENDANCE_FORBIDDEN: intenta fichar turno de otro user.
- 403 ATTENDANCE_LOCATION_OUT_OF_RANGE: fuera del radio permitido.
- 404 SHIFT_NOT_FOUND: turno no existe o no pertenece a tu organization.
- 409 SHIFT_NOT_CLOCKABLE: turno CANCELLED o MISSED.
- 409 CLOCK_OUT_ALREADY_EXISTS: ya tiene salida.

Get attendance GET - /planning/attendance
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/attendance
    /planning/attendance?from=2026-05-01T00:00:00.000Z&to=2026-06-01T00:00:00.000Z
    /planning/attendance?userId=2
    /planning/attendance?userIds=2,3,4
    /planning/attendance?shiftId=10
    /planning/attendance?type=CLOCK_IN
Notas:
- ADMIN/MANAGER pueden filtrar por userId, userIds, shiftId, type, from, to.
- EMPLOYEE solo puede ver su attendance.
- type acepta CLOCK_IN o CLOCK_OUT.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 400 INVALID_DATE_RANGE: from >= to.
- 400 INVALID_USER_FILTERS: se envia userId y userIds a la vez.
- 403 ATTENDANCE_FORBIDDEN: employee intenta ver fichajes de otro user.
- 403 USER_FORBIDDEN: userId/userIds no pertenecen a tu organization.
- 404 SHIFT_NOT_FOUND: shiftId no existe o no pertenece a tu organization.

Get week attendance GET - /planning/attendance/week
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/attendance/week
    /planning/attendance/week?userId=2
Notas:
- Semana actual de lunes a domingo.
- EMPLOYEE solo puede ver su semana.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 403 PLANNING_FORBIDDEN: employee intenta ver otro user.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.

Get month attendance GET - /planning/attendance/month
Permitido: ADMIN, MANAGER, EMPLOYEE
Ejemplos:
    /planning/attendance/month
    /planning/attendance/month?userId=2
Notas:
- Mes actual completo.
- EMPLOYEE solo puede ver su mes.
Errores controlados:
- 400 VALIDATION_ERROR: query invalida.
- 403 PLANNING_FORBIDDEN: employee intenta ver otro user.
- 403 USER_FORBIDDEN: userId no pertenece a tu organization.
