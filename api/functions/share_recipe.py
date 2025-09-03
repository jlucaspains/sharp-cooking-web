import logging
import json
import json
import random
import string
import jsonschema
import qrcode
import qrcode.image.svg

import azure.functions as func
from jsonschema import validate

from uuid import uuid4
from time import perf_counter

from .repository import Repository
from .models import recipeSchema

repository = Repository()
bp = func.Blueprint()
qr = qrcode.QRCode(image_factory=qrcode.image.svg.SvgPathImage)

def mock_repository(mock_repository: Repository):
    global repository
    repository = mock_repository

@bp.route(route="share-recipe", methods=["POST"]) 
def share_recipe(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()

    if not repository.connected:
        repository.connect()

    rand = random.SystemRandom()
    share_id = ''.join(rand.choices(population=string.ascii_uppercase +  string.digits, k=6))

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
            "media": req_body.get("media"),
            "ttl": ttl
        }
        operation_result = repository.create_item(new_item)
        logging.debug(operation_result)

        qr = qrcode.QRCode(image_factory=qrcode.image.svg.SvgPathImage)
        qr.add_data(share_id)
        qr.make(fit=True)

        img = qr.make_image()

        result = json.dumps({ "id": share_id, "qr_code": img.to_string(encoding='unicode'), "ttl": ttl })

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