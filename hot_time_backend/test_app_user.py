from app.data.repositories.app_user_repository import AppUserRepository
from app.domain.entities.app_user import AppUser
from app.domain.enums.users.role_type import RoleType
from app.domain.enums.users.disponibility_type import DisponibilityType

repo = AppUserRepository()

user = AppUser(
    name="Juan",
    email="juan@email.com",
    password="123456",
    phone="612345678",         # obligatorio
    contract_path="/contratos/juan.pdf",  # obligatorio
    role=RoleType.ADMIN,
    disponibility=DisponibilityType.FULL,
    disponibility_text=""
)

created_user = repo.create(user)
print(created_user)