from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.app_user import AppUser


class IAppUserRepository(ABC):

    @abstractmethod
    def create(self, user: AppUser) -> AppUser:
        pass

    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[AppUser]:
        pass

    @abstractmethod
    def get_all(self) -> List[AppUser]:
        pass

    @abstractmethod
    def update(self, user: AppUser) -> AppUser:
        pass

    @abstractmethod
    def delete(self, user_id: int) -> None:
        pass