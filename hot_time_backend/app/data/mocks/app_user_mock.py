# data/mocks/app_user_mock.py

from domain.entities.app_user import AppUser
from domain.enums.app_user import RoleType
from domain.enums.app_user import DisponibilityType

# Mock de categorías (para relacionar users)
CATEGORY_SALA = 1
CATEGORY_COCINA = 2
CATEGORY_FRIEGAPLATOS = 3

# Lista de usuarios
user_mock = [
    AppUser(
        id_usuario=1,
        nombre="Admin Principal",
        email="admin@hotime.com",
        password="admin123",
        role=RoleType.ADMIN,
        category_id=None
    ),
    
    AppUser(
        id_usuario=2,
        nombre="Manager Sala",
        email="manager.sala@hotime.com",
        password="manager123",
        role=RoleType.MANAGER,
        category_id=CATEGORY_SALA
    ),
    AppUser(
        id_usuario=3,
        nombre="Manager Cocina",
        email="manager.cocina@hotime.com",
        password="manager123",
        role=RoleType.MANAGER,
        category_id=CATEGORY_COCINA
    ),
]

for i in range(4, 19):
    if i % 2 == 0:
        cat = CATEGORY_SALA
    else:
        cat = CATEGORY_COCINA
    user_mock.append(
        AppUser(
            id_usuario=i,
            nombre=f"Empleado {i}",
            email=f"empleado{i}@hotime.com",
            password="empleado123",
            role=RoleType.EMPLOYEE,
            category_id=cat
        )
    )

# 2 empleados Friegaplatos (sin manager)
user_mock.append(
    AppUser(
        id_usuario=19,
        nombre="Empleado Friegaplatos 1",
        email="friegaplatos1@hotime.com",
        password="empleado123",
        role=RoleType.EMPLOYEE,
        category_id=CATEGORY_FRIEGAPLATOS
    )
)
user_mock.append(
    AppUser(
        id_usuario=20,
        nombre="Empleado Friegaplatos 2",
        email="friegaplatos2@hotime.com",
        password="empleado123",
        role=RoleType.EMPLOYEE,
        category_id=CATEGORY_FRIEGAPLATOS
    )
)