from datetime import datetime

class Schedule:

    def __init__(
        self,
        id: int,
        user_id: int,
        start_datetime: datetime,
        end_datetime: datetime,
    ):
        self.id = id
        self.user_id = user_id
        self.start_datetime = start_datetime
        self.end_datetime = end_datetime