from abc import ABC, abstractmethod
from domain.entities.app_user import AppUser

class IAppUserRepository(ABC):
    @abstractmethod
    def create(self, user: AppUser) -> AppUser:
        pass

    @abstractmethod
    def delete(self, user_id: int) -> bool:
        pass

    @abstractmethod
    def update(self, user: AppUser) -> AppUser:
        pass

    @abstractmethod
    def get_by_id(self, user_id: int) -> AppUser:
        pass

    @abstractmethod
    def get_all(self) -> list[AppUser]:
        pass

    @abstractmethod
    def get_by_role(self, role: str) -> list[AppUser]:
        pass

    @abstractmethod
    def get_by_category(self, category_id: int) -> list[AppUser]:
        pass
