from domain.enums.app_user.role_type import RoleType
from domain.enums.app_user.disponibility_type import DisponibilityType

class AppUser:
    def __init__(
        self,
        id_usuario: int,
        nombre: str,
        email: str,
        role: RoleType,
        disponibility: DisponibilityType,
        disponibility_text: str,
        phone: str,
        country_code: str,
        contract_path: str,
        category_id: int,
        password: str
    ):
        self.id_usuario = id_usuario
        self.nombre = nombre
        self.email = email
        self.role = role
        self.disponibility = disponibility
        self.disponibility_text = disponibility_text
        self.phone = phone
        self.country_code = country_code
        self.contract_path = contract_path
        self.category_id = category_id
        self.password = password