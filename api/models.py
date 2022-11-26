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