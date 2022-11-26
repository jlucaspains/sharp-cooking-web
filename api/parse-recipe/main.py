import logging
import json
import azure.functions as func

from zipfile import ZipFile
from recipe_scrapers import scrape_me
from pint import UnitRegistry
from uuid import uuid4
from time import perf_counter

from .util import parse_recipe_ingredient, parse_recipe_ingredients, parse_recipe_instruction
from .util import parse_recipe_instructions, parse_recipe_image, parse_image
from .models import ImageResult, ParseRequest, Recipe

ureg = UnitRegistry()

def main(req: func.HttpRequest) -> func.HttpResponse:
    correlation_id = uuid4()

    req_body = req.get_json()
    url: str = req_body.get("url")
    downloadImage: bool = req_body.get("downloadImage") or False
    try:
        start = perf_counter()
        logging.info(f"processing parse request id {correlation_id} for url: {url}")
        scraper = scrape_me(url, wild_mode=True)
        
        lang = scraper.language() or "en"
        
        ingredients = map(lambda x: parse_recipe_ingredient(x, lang, ureg), scraper.ingredients())
        instructions = map(lambda x: parse_recipe_instruction(x, lang), scraper.instructions_list())
        
        result = {
            "title": scraper.title(),
            "totalTime": scraper.total_time(),
            "yields": scraper.yields(),
            "ingredients": list(ingredients),
            "instructions": list(instructions),
            "image": scraper.image(),
            "host": scraper.host()
        }
        
        if downloadImage:
            image_uri = parse_recipe_image(result["image"])
            result["image"] = image_uri

        return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
    except Exception as e:
        logging.error(f"Failed to process parse request id {correlation_id}. Error: {e}")
        
        return func.HttpResponse("Could not find a recipe in the web page", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing parse request id {correlation_id}. Time taken: {end - start:0.4f}s")