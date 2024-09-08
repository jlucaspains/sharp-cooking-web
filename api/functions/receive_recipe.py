import logging
import json

import azure.functions as func
from azure.cosmos import exceptions

from uuid import uuid4
from time import perf_counter

from .repository import Repository

repository = Repository()
bp = func.Blueprint()

def mock_repository(mock_repository: Repository):
    global repository
    repository = mock_repository

@bp.route(route="receive-recipe", methods=["POST"]) 
def receive_recipe(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    try:
        logging.info(f"processing share request id {correlation_id}")

        req_body = req.get_json()
        code: str = req_body.get("code")

        item = repository.read_item(code)

        # removes the properties added by cosmos db
        item_clean = {
            "id": item.get("id"),
            "title": item.get("title"),
            "notes": item.get("notes"),
            "ingredients": item.get("ingredients"),
            "steps": item.get("steps"),
            "source": item.get("source"),
            "media": item.get("media"),
        }

        result = json.dumps(item_clean)

        return func.HttpResponse(result, status_code=200, mimetype="application/json")
    except exceptions.CosmosResourceNotFoundError as e:
        logging.error(f"Failed to process share request id {correlation_id}. The id provided does not exist.")
        
        return func.HttpResponse("Could not receive the recipe because it does not exist.", status_code=404)
    except Exception as e:
        logging.error(f"Failed to process share request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could not receive the recipe due to an internal issue. Please try again.", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing receive recipe request id {correlation_id}. Time taken: {end - start:0.4f}s")