from enums import role_type, disponibility_type 

class App_user:

    def __init__(
       self, 
       id: int, 
       name: str, 
       email: str, 
       password: str,
       country_code: str,
       phone: int,
       rol: role_type,
       disponibility: disponibility_type,
       disponibility_text: str,
       category_id: int,
       contract_path: str  
    ): 
        self.id = id
        self.name = name 
        self.email = email
        self.password = password
        self.country_code = country_code
        self.phone = phone
        self.rol = rol
        self.disponibility = disponibility
        self.disponibility_text = disponibility_text
        self.category_id = category_id
        self.contract_path = contract_path
        
