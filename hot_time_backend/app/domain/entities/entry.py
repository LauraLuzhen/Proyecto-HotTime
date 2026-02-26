from datetime import datetime

class Entry:

    def __init__(
        self,
        user_id: int,
        schedule_id: int,
        check_in: datetime,
        check_out: datetime,
        worked_minutes: int,
    ):
        self.user_id = user_id
        self.schedule_id = schedule_id
        self.check_in = check_in
        self.check_out = check_out
        self.worked_minutes = worked_minutes