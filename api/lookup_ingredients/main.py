import logging
import json
import os
import json
import string

import azure.functions as func
from jsonschema import validate

from uuid import uuid4
from time import perf_counter

import requests

from ..models import lookupIngredientsSchema

from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

service_endpoint = os.environ["AZURE_SEARCH_SERVICE_ENDPOINT"]
index_name = os.environ["AZURE_SEARCH_INDEX_NAME"]
key = os.environ["AZURE_SEARCH_API_KEY"]

search_client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))

def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    try:
        logging.info(f"processing azure search request id {correlation_id}")

        ingredients = req.get_json()
        validate(instance=ingredients, schema=lookupIngredientsSchema)

        results = []
        for ingredient in ingredients:
            ingredient_result = {"ingredient": ingredient, "results": []}
            
            search_results = search_client.search(search_text=ingredient, top=3)
            
            for result in search_results:
                ingredient_result["results"].append({"id": result["id"], "description": result["description"]})

            results.append(ingredient_result)

        return func.HttpResponse(json.dumps(results), status_code=200, mimetype="application/json")
    except Exception as e:
        logging.error(f"Failed to process azure search request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could not process azure search due to an internal issue. Please try again.", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing azure search request id {correlation_id}. Time taken: {end - start:0.4f}s")