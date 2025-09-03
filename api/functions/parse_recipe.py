import logging
import json

import azure.functions as func

from uuid import uuid4
from time import perf_counter

from .util import get_mock_html, get_recipe_from_scraper, get_html

bp = func.Blueprint()

mock_recipe_html = None
def set_mock_recipe_html(mock_recipe: str | None):
    global mock_recipe_html
    mock_recipe_html = mock_recipe

@bp.route(route="parse-recipe", methods=["POST"]) 
def parse_recipe(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    req_body = req.get_json()
    url: str = req_body.get("url")
    download_image: bool = req_body.get("downloadImage") or False
    try:
        logging.info(f"processing parse request id {correlation_id} for url: {url}")
        
        if mock_recipe_html is not None:
            print("using mock and url " + url)
            scraper = get_mock_html(mock_recipe_html, url)
        else:
            scraper = get_html(url)

        result = get_recipe_from_scraper(scraper, download_image)

        return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
    except Exception as e:
        logging.error(f"Failed to process parse request id {correlation_id}. Error: {e}")
        
        return func.HttpResponse("Could not find a recipe in the web page", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing parse request id {correlation_id}. Time taken: {end - start:0.4f}s")
