from enum import Enum

class rol_type(str, Enum):
    EMPLOYEE = 'employee'
    MANAGER = 'manager'
    ADMIN = 'admin'