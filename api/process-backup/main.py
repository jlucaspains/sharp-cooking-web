import logging
import json
import io

import azure.functions as func

from zipfile import ZipFile
from uuid import uuid4
from time import perf_counter
from pint import UnitRegistry

from ..util import parse_recipe_ingredients, parse_recipe_instructions, parse_image

ureg = UnitRegistry()

def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()
    try:
        logging.info(f"processing backup request id {correlation_id}")
        
        if (len(req.files) != 1):
            return func.HttpResponse("A single file is required to process", status_code=400)
        
        for file in req.files.values():
            filename = file.filename
            contents = file.stream.read()
                
            if file.content_type != "application/x-zip-compressed" and file.content_type != "application/zip":
                return func.HttpResponse("Only zip files are acceptted", status_code=400)
        
            with ZipFile(io.BytesIO(contents), 'r') as zip:
                json_file = zip.read("SharpBackup_Recipe.json")
                json_content = json.load(io.BytesIO(json_file))
                
                result = []
                for recipe in json_content:
                    image_file = zip.read(recipe["MainImagePath"])
                    result.append({
                        "title": recipe["Title"],
                        "totalTime": 0,
                        "yields": "",
                        "ingredients": parse_recipe_ingredients(recipe["Ingredients"], ureg),
                        "instructions": parse_recipe_instructions(recipe["Instructions"]),
                        "image": parse_image(recipe["MainImagePath"], image_file),
                        "host": "",
                        "notes": recipe["Notes"]
                    })

                return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
            
        return func.HttpResponse("Failed to process", status_code=400)
    except Exception as e:
        logging.error(f"Failed to process backup request id {correlation_id}. Error: {e}")
        return func.HttpResponse("The backup file does not seem to be well formatted or generated by Sharp Cooking app", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing backup request id {correlation_id}. Time taken: {end - start:0.4f}s")