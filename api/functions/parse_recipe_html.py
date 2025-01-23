import logging
import json

import azure.functions as func

from uuid import uuid4
from time import perf_counter

from recipe_scrapers import scrape_html, AbstractScraper

from .util import get_recipe_from_scraper

bp = func.Blueprint()

@bp.route(route="parse-recipe-html", methods=["POST"]) 
def parse_recipe_html(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    url: str = req.form.get("url")
    html: str = req.form.get("html")
    scraper: AbstractScraper
    download_image: bool = req.form.get("downloadImage") or False
    try:
        logging.info(f"processing parse request id {correlation_id} for url: {html}")
        for file in req.files.values():
            scraper = scrape_html(file.stream.read(), url, wild_mode=True)
        
        result = get_recipe_from_scraper(scraper, download_image)

        return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
    except Exception as e:
        logging.error(f"Failed to process parse request id {correlation_id}. Error: {e}")
        
        return func.HttpResponse("Could not find a recipe in the web page", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing parse request id {correlation_id}. Time taken: {end - start:0.4f}s")
