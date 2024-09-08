from typing import Union

class BaseModel():
    test: str

class RecipeIngredient(BaseModel):
    raw: str
    quantity: float
    unit: str

class RecipeInstruction(BaseModel):
    raw: str
    minutes: float

class Recipe(BaseModel):
    title: Union[str, None] = None
    totalTime: Union[int, None] = None
    yields: Union[str, None] = None
    ingredients: list[RecipeIngredient] = []
    steps: list[RecipeInstruction] = []
    image: Union[str, None] = None
    host: Union[str, None] = None
    notes: Union[str, None] = None

class ParseRequest(BaseModel):
    url: str
    downloadImage: bool = False

class ImageResult(BaseModel):
    name: str
    image: str

recipeSchema = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "minLength": 1},
        "notes": {"type": ["string", "null"], "minLength": 0},
        "source": {"type": ["string", "null"], "minLength": 1},
        "ingredients": {
            "type": "array",
            "items": {
                "type": "string",
                "minLength": 1
            }
        },
        "steps": {
            "type": "array",
            "items": {
                "type": "string",
                "minLength": 1
            }
        },
        "media": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "minLength": 1},
                    "url": {"type": "string", "minLength": 1}
                },
            }
        },
    },
    "required": ["title", "ingredients", "steps"],
}


calcNutritionSchema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id": {"type": "string", "minLength": 1},
            "quantity": {"type": "number", "minimum": 0},
            "unit": {"type": "string", "minLength": 1},
        },
        "required": ["id", "quantity", "unit"],
    }
}

lookupIngredientsSchema = {
    "type": "array",
    "items": {
        "type": "string",
    }
}