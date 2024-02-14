from jsonschema import validate
from ..models import recipeSchema

def test_recipe_schema():
    req_body = {
        "title": "Sourdough Bread",
        "notes": "Some notes about the recipe",
        "source": "https://recipes.com/my-recipe",
        "ingredients": ["500g flour", "300g water", "10g salt", "80g starter"],
        "steps": ["Mix", "Bake", "Eat"],
        # kept for compatibility only
        "images": [], 
        "media": [{"type": "img", "url": "bread.jpg"}],
    }
    validate(instance=req_body, schema=recipeSchema)