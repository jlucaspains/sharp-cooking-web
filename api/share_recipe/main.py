import logging
import json
import os
import json
import random
import string
from typing import Any, Dict
import jsonschema

import azure.functions as func
from azure.cosmos import CosmosClient, PartitionKey
from jsonschema import validate

from uuid import uuid4
from time import perf_counter

from ..repository import Repository

recipeSchema = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "minLength": 1},
        "notes": {"type": ["string", "null"], "minLength": 1},
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
        "images": {
            "type": "array",
            "items": {
                "type": "string",
                "minLength": 1
            }
        },
    },
    "required": ["title", "ingredients", "steps"],
}

repository = Repository()

def mock_repository(mock_repository: Repository):
    global repository
    repository = mock_repository

def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    share_id = ''.join(random.choices(string.ascii_uppercase +  string.digits, k=6))

    try:
        logging.info(f"processing share request id {correlation_id}")

        req_body = req.get_json()
        validate(instance=req_body, schema=recipeSchema)

        ttl = 60 * 60

        new_item = {
            "id": share_id,
            "title": req_body.get("title"),
            "notes": req_body.get("notes"),
            "ingredients": req_body.get("ingredients"),
            "steps": req_body.get("steps"),
            "source": req_body.get("source"),
            "images": req_body.get("images"),
            "ttl": ttl
        }
        operation_result = repository.create_item(new_item)
        logging.debug(operation_result)

        result = json.dumps({ "id": share_id, "ttl": ttl })

        return func.HttpResponse(result, status_code=202, mimetype="application/json")
    except jsonschema.exceptions.ValidationError as e:
        logging.error(f"Failed to process share request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could not share recipe because the data provided is invalid. Please try again.", status_code=400)
    except Exception as e:
        logging.error(f"Failed to process share request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could share the recipe due to an internal issue. Please try again.", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing share request id {correlation_id}. Time taken: {end - start:0.4f}s")