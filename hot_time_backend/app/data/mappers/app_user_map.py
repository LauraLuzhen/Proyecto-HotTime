from domain.entities.app_user import AppUser

def map_model_to_domain(user_model) -> AppUser:
    return AppUser(
        id_usuario=user_model.id_usuario,
        nombre=user_model.nombre,
        email=user_model.email,
        role=user_model.role,
        disponibility=user_model.disponibility,
        disponibility_text=user_model.disponibility_text,
        phone=user_model.phone,
        country_code=user_model.country_code,
        contract_path=user_model.contract_path,
        category_id=user_model.category_id,
        password=user_model.password
    )