import azure.functions as func
from parse_recipe import bp as parse_recipe_bp
from process_backup import bp as process_backup_bp
from process_image import bp as process_image_bp
from receive_recipe import bp as receive_recipe_bp
from share_recipe import bp as share_recipe_bp

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

app.register_functions(parse_recipe_bp)
app.register_functions(process_backup_bp)
app.register_functions(process_image_bp)
app.register_functions(receive_recipe_bp)
app.register_functions(share_recipe_bp)