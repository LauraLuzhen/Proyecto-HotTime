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
    "categoryId": 1
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
    "categoryId": null
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
