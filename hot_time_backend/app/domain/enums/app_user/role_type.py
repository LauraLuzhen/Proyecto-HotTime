from enum import Enum

class RolType(str, Enum):
    EMPLOYEE = 'employee'
    MANAGER = 'manager'
    ADMIN = 'admin'