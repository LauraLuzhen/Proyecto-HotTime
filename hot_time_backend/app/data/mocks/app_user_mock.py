from typing import Dict
from app.domain.entities.app_user import AppUser


class AppUserMockDB:
    _users: Dict[int, AppUser] = {}
    _id_counter: int = 1

    @classmethod
    def insert(cls, user: AppUser) -> AppUser:
        user.id = cls._id_counter
        cls._users[cls._id_counter] = user
        cls._id_counter += 1
        return user

    @classmethod
    def get(cls, user_id: int):
        return cls._users.get(user_id)

    @classmethod
    def get_all(cls):
        return list(cls._users.values())

    @classmethod
    def delete(cls, user_id: int):
        if user_id in cls._users:
            del cls._users[user_id]