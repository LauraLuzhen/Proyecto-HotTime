from typing import List, Optional
from app.domain.entities.app_user import AppUser
from app.domain.interfaces.repositories.i_app_user_repository import IAppUserRepository
from app.data.mocks.app_user_mock import AppUserMockDB


class AppUserRepository(IAppUserRepository):

    def create(self, user: AppUser) -> AppUser:
        return AppUserMockDB.insert(user)

    def get_by_id(self, user_id: int) -> Optional[AppUser]:
        return AppUserMockDB.get(user_id)

    def get_by_email(self, email: str) -> Optional[AppUser]:
        users = AppUserMockDB.get_all()
        for user in users:
            if user.email == email:
                return user
        return None

    def get_all(self) -> List[AppUser]:
        return AppUserMockDB.get_all()

    def update(self, user: AppUser) -> AppUser:
        if not user.id:
            raise ValueError("User must have ID to update")
        AppUserMockDB._users[user.id] = user
        return user

    def delete(self, user_id: int) -> None:
        AppUserMockDB.delete(user_id)