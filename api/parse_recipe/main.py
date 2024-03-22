import logging
import json

import azure.functions as func
from contextlib import suppress

from recipe_scrapers import scrape_me, _abstract
from pint import UnitRegistry
from uuid import uuid4
from time import perf_counter

from ..util import parse_recipe_ingredient, parse_recipe_instruction, parse_recipe_image

_abstract.HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/123.0"
}

ureg = UnitRegistry()

def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    req_body = req.get_json()
    url: str = req_body.get("url")
    download_image: bool = req_body.get("downloadImage") or False
    try:
        logging.info(f"processing parse request id {correlation_id} for url: {url}")
        scraper = scrape_me(url, wild_mode=True)
        
        lang = scraper.language() or "en"
        
        ingredients = map(lambda x: parse_recipe_ingredient(x, lang, ureg), scraper.ingredients())
        instructions = map(lambda x: parse_recipe_instruction(x, lang), scraper.instructions_list())
        yields, yields_description = parse_yields(scraper.yields())
        result = {
            "title": scraper.title(),
            "totalTime": scraper.total_time(),
            "yields": yields,
            "yieldsDescription": yields_description,
            "ingredients": list(ingredients),
            "steps": list(instructions),
            "image": scraper.image(),
            "host": scraper.host(),
            "language": scraper.language()
        }

        # since nutrients are not always available, we need to suppress the exception
        with suppress(NotImplementedError):
            result["nutrients"] = parse_nutrients(scraper.nutrients())

        result["image"] = parse_recipe_image(result["image"]) if download_image else result["image"]

        return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
    except Exception as e:
        logging.error(f"Failed to process parse request id {correlation_id}. Error: {e}")
        
        return func.HttpResponse("Could not find a recipe in the web page", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing parse request id {correlation_id}. Time taken: {end - start:0.4f}s")

def parse_nutrients(nutrients: dict):
    return {
        "calories": parse_nutrient_value(nutrients.get("calories")),
        "totalFat": parse_nutrient_value(nutrients.get("fatContent")),
        "saturatedFat": parse_nutrient_value(nutrients.get("saturatedFatContent")),
        "unsaturatedFat": parse_nutrient_value(nutrients.get("unsaturatedFatContent")),
        "transFat": parse_nutrient_value(nutrients.get("transFatContent")),
        "carbohydrates": parse_nutrient_value(nutrients.get("carbohydrateContent")),
        "sugar": parse_nutrient_value(nutrients.get("sugarContent")),
        "cholesterol": parse_nutrient_value(nutrients.get("cholesterolContent")),
        "sodium": parse_nutrient_value(nutrients.get("sodiumContent")),
        "protein": parse_nutrient_value(nutrients.get("proteinContent")),
        "fiber": parse_nutrient_value(nutrients.get("fiberContent"))
    }

def parse_yields(yields: str):
    if not yields:
        return 0, ""
    
    parts = yields.split(" ")
    
    return float(parts[0]), parts[1] if len(parts) > 1 else ""

def parse_nutrient_value(value: str) -> float:
    if not value:
        return 0
    
    return float(value.split(" ")[0]) if value else 0