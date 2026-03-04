import re
from dataclasses import dataclass
from typing import Optional
from app.domain.enums.users.role_type import RoleType
from app.domain.enums.users.disponibility_type import DisponibilityType

EMAIL_REGEX = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
PHONE_REGEX = r'^[0-9]{9}$'
COUNTRY_CODE_REGEX = r'^\+[0-9]{1,4}$'

@dataclass
class AppUser:
    # Obligatorios
    name: str
    email: str
    password: str
    phone: str
    contract_path: str

    # Opcionales / con default
    id: Optional[int] = None
    country_code: str = "+34"
    role: RoleType = RoleType.EMPLOYEE
    disponibility: DisponibilityType = DisponibilityType.FULL
    disponibility_text: Optional[str] = None
    category_id: Optional[int] = None

    def __post_init__(self):
        self._validate()

    def _validate(self):
        if not re.match(EMAIL_REGEX, self.email):
            raise ValueError("Invalid email format")

        if self.phone and not re.match(PHONE_REGEX, self.phone):
            raise ValueError("Phone must be 9 digits")

        if not re.match(COUNTRY_CODE_REGEX, self.country_code):
            raise ValueError("Invalid country code")
        
        if self.role not in RoleType:
            raise ValueError("rol erróneo")
        
        if self.disponibility not in DisponibilityType:
            raise ValueError("disponibilidad errónea")

        if self.disponibility == DisponibilityType.FULL and self.disponibility_text:
            raise ValueError("disponibility_text must be null if disponibility is FULL")

        
        if self.disponibility == DisponibilityType.OTHER and not self.disponibility_text:
            raise ValueError("disponibility_text required if disponibility is OTHER")
        
    

        

        