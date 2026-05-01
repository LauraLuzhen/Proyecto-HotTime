## AUTH
LogIn -> token ✅
{
    "email": "laurarm1002@gmail.com",
    "password": "Password1."
}
ForgotPassword -> resetToken
{
    "email": "laurarm1002@gmail.com"
}
ResetPassword -> boolean
{
    "resetToken": resetToken,
    "password": newPassword
}
