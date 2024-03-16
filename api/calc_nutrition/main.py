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

from ..models import calcNutritionSchema

nutrients_list = ["208", "298", "606", "605", "645", "646", "601", "307", "205", "291", "269.3", "203", "328", "301", "303", "306"]

def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()
    key = os.environ.get("USDA_KEY")

    try:
        logging.info(f"processing nutrition calculation request id {correlation_id}")
        url = f'https://api.nal.usda.gov/fdc/v1/foods/search?api_key={key}'

        ingredients = req.get_json()
        validate(instance=ingredients, schema=calcNutritionSchema)

        matched_ingredients = []
        nutrition_items = {}

        for ingredient in ingredients:
            id = ingredient["id"]

            body = {
                "query": id,
                "dataType": [
                    "Foundation"
                ],
                "pageSize": 1,
                "pageNumber": 1,
                "sortBy": "dataType.keyword",
                "sortOrder": "asc",
                "requireAllWords": "true"
            }
            response = requests.post(url, json=body)

            json_result = response.json()
            matched_ingredients.append(json_result["foods"][0]["description"])
            nutrition = list(filter(lambda x: x["nutrientNumber"] in nutrients_list, json_result["foods"][0]["foodNutrients"]))

            for item in nutrition:
                # handle added sugar
                if json_result["foods"][0]["fdcId"] == 746784 and item["nutrientNumber"] == "269.3":
                    nutrition_items["AddedSugar"] = {
                        "nutrientNumber": "AddedSugar", 
                        "nutrientName": "Added Sugar",
                        "unitName": item["unitName"],
                        "value": item["value"],
                    }
                
                if item["nutrientName"] in nutrition_items:
                    nutrition_items[item["nutrientName"]] = {
                        "nutrientNumber": item["nutrientNumber"], 
                        "nutrientName": item["nutrientName"],
                        "unitName": item["unitName"],
                        "value": item["value"] + nutrition_items[item["nutrientName"]]["value"],
                    }
                else:
                    nutrition_items[item["nutrientName"]] = {
                        "nutrientNumber": item["nutrientNumber"], 
                        "nutrientName": item["nutrientName"],
                        "unitName": item["unitName"],
                        "value": item["value"],
                    }

        result = {
            "ingredients": matched_ingredients,
            "nutrition": list(nutrition_items.values())
        }
        
        return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
    except Exception as e:
        logging.error(f"Failed to calculate nutrition value request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could not calculate nutrition due to an internal issue. Please try again.", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing share request id {correlation_id}. Time taken: {end - start:0.4f}s")