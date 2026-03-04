import re
from dataclasses import dataclass
from typing import Optional
from ..enums.users.role_type import RoleType
from ..enums.users.disponibility_type import DisponibilityType
from ..rules.rules import EMAIL_RULE, PASSWORD_RULE, PHONE_RULE

@dataclass
class AppUser:
    # Obligatorios
    name: str
    email: str
    password: str
    phone: str
    contract_path: str
    # Default
    id: Optional[int] = None
    role: RoleType = RoleType.EMPLOYEE
    disponibility: DisponibilityType = DisponibilityType.FULL
    # Opcionales    
    disponibility_text: Optional[str] = None
    category_id: Optional[int] = None

    def __post_init__(self):
        self._validate()
        self._normalize_role()
        self._normalize_disponibility()
    
    def _normalize_role(self):
        if isinstance(self.role, str):
            # Si es string
            role_upper = self.role.strip().upper()
            try:
                self.role = RoleType[role_upper]
            except KeyError:
                raise ValueError(f"Invalid role. Valid roles are: {[r.name for r in RoleType]}")
        elif not isinstance(self.role, RoleType):
            # Si no es string ni roletype
            raise ValueError("Role must be a valid RoleType")
    
    def _normalize_disponibility(self):
        if isinstance(self.disponibility, str):
            # Si es string
            disponibility_upper = self.disponibility.strip().upper()
            try:
                self.disponibility = DisponibilityType[disponibility_upper]
            except KeyError:
                raise ValueError(f"Invalid disponibility. Valid disponibilities are: {[d.name for d in DisponibilityType]}")
        elif not isinstance(self.disponibility, DisponibilityType):
            # Si no es string ni disponibilitytype
            raise ValueError("Disponibility must be a valid DisponibilityType")
        
    def _validate(self):
        # Obligatories attributes
        if not self.name.strip():
            raise ValueError("Name can not be empty")
        if not self.email.strip():
            raise ValueError("Email can not be empty")
        if not self.password.strip():
            raise ValueError("Password can not be empty")
        if not self.phone.strip():
            raise ValueError("Phone can not be empty")
        if not self.contract_path.strip():
            raise ValueError("Contract path can not be empty")
        
        # Logic rules 
        if not re.match(EMAIL_RULE, self.email):
            raise ValueError("Email must have its format like name@email.com")
        if not re.match(PASSWORD_RULE, self.password):
            raise ValueError("Password must have ")
        if not re.match(PHONE_RULE, self.phone):
            raise ValueError('Phone must have 9 digits')
        
        # Logic enum disponibility
        # FULL
        if self.disponibility == DisponibilityType.FULL:
            self.disponibility_text = None
        # OTHER
        elif self.disponibility == DisponibilityType.OTHER:
            if not self.disponibility_text or not self.disponibility_text.strip():
                raise ValueError("disponibility_text is required when disponibility is OTHER")
            self.disponibility_text = self.disponibility_text.strip()