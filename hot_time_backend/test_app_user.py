from app.domain.entities.app_user import AppUser
from app.domain.enums.users.role_type import RoleType
from app.domain.enums.users.disponibility_type import DisponibilityType

user1 = AppUser(
    name = 'laura',
    email = 'lauraemail.com',
    password =  'Laura12.laura',
    phone = '123456789',
    contract_path= 'contrato1.pdf',
    role = 'admin',
    disponibility='other',
    disponibility_text='hola'
)

print(user1)