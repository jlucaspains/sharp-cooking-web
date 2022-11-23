import logging

import azure.functions as func

# from pydantic import BaseModel
from typing import Union
from pint import UnitRegistry
from recipe_scrapers import scrape_me
from zipfile import ZipFile
from PIL import Image
from fractions import Fraction

class RecipeIngredient():
    raw: str
    quantity: float
    unit: str

class RecipeInstruction():
    raw: str
    minutes: float

class ParseRequest():
    def __init__(self, url: str, downloadImage: bool):
      self.url = url
      self.downloadImage = downloadImage

    url: str
    downloadImage: bool = False

class Recipe():
    title: Union[str, None] = None
    totalTime: Union[int, None] = None
    yields: Union[str, None] = None
    ingredients: list[RecipeIngredient] = []
    instructions: list[RecipeInstruction] = []
    image: Union[str, None] = None
    host: Union[str, None] = None
    notes: Union[str, None] = None

def main(req: func.HttpRequest) -> func.HttpResponse:

    # ureg = UnitRegistry()
    try:
        req_body = req.get_json()

        input = ParseRequest(req_body.get('url'), req_body.get('downloadImage'))

        logging.info(f'Received request for ParseRecipe with URL: {input.url}')

        return func.HttpResponse(f"URL: {input.url}; downloadImage: {input.downloadImage}.", status_code=200)
        
    except ValueError:
        logging.error('Failed to parse input data')

        return func.HttpResponse("Input data is bad", status_code=400)
