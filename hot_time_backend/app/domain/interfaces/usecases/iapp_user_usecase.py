from domain.interfaces.usecases import IAppUserUseCase
from domain.entities.app_user import AppUser
from domain.interfaces.repositories import IAppUserRepository

class AppUserUseCase(IAppUserUseCase):
    def __init__(self, repo: IAppUserRepository):
        self.repo = repo

    def create_user(self, user: AppUser) -> AppUser:
        if user.role not in ["employee", "manager", "admin"]:
            raise ValueError("Role no válido")
        return self.repo.create(user)

    def delete_user(self, user_id: int) -> bool:
        return self.repo.delete(user_id)

    def login(self, email: str, password: str) -> AppUser:
        user = self.repo.get_by_email(email)
        if not user or user.password != password:
            raise ValueError("Email o password incorrectos")
        return user

    def logout(self, user_id: int) -> None:
        # lógica de logout
        pass

    def get_all_users(self) -> list[AppUser]:
        return self.repo.get_all()

    def get_user_by_id(self, user_id: int) -> AppUser:
        return self.repo.get_by_id(user_id)

    def get_users_by_role(self, role: str) -> list[AppUser]:
        return self.repo.get_by_role(role)

    def update_password(self, user_id: int, new_password: str) -> AppUser:
        user = self.repo.get_by_id(user_id)
        user.password = new_password
        return self.repo.update(user)

    def update_email(self, user_id: int, new_email: str) -> AppUser:
        user = self.repo.get_by_id(user_id)
        user.email = new_email
        return self.repo.update(user)

    def update_phone(self, user_id: int, new_phone: str) -> AppUser:
        user = self.repo.get_by_id(user_id)
        user.phone = new_phone
        return self.repo.update(user)

    def update_disponibility(self, user_id: int, disponibility: str, disponibility_text: str = None) -> AppUser:
        user = self.repo.get_by_id(user_id)
        user.disponibility = disponibility
        user.disponibility_text = disponibility_text
        return self.repo.update(user)

    def upload_contract(self, user_id: int, contract_path: str) -> AppUser:
        user = self.repo.get_by_id(user_id)
        user.contract_path = contract_path
        return self.repo.update(user)

    def download_contract(self, user_id: int) -> str:
        user = self.repo.get_by_id(user_id)
        return user.contract_path

    def get_users_by_category(self, category_id: int) -> list[AppUser]:
        return self.repo.get_by_category(category_id)

    def update_category(self, user_id: int, category_id: int) -> AppUser:
        user = self.repo.get_by_id(user_id)
        user.category_id = category_id
        return self.repo.update(user)