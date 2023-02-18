import logging
import json

import azure.functions as func

from zipfile import ZipFile
from uuid import uuid4
from time import perf_counter

from ..util import parse_image

def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()
    try:
        logging.info(f"processing image request id {correlation_id}")
        
        if req.files is None:
            return func.HttpResponse("A single file is required to process", status_code=400)
        
        for file in req.files.values():
            filename = file.filename
            contents = file.stream.read()
            
            if not file.content_type.startswith("image"):
                return func.HttpResponse("Only image files are accepted", status_code=400)

            result = {
                "name": filename,
                "image": parse_image(filename, contents)
            }

            return func.HttpResponse(json.dumps(result), status_code=200, mimetype="application/json")
        
        return func.HttpResponse("Failed to process", status_code=400)
    except Exception as e:
        logging.error(f"Failed to process image request id {correlation_id}. Error: {e}")
        return func.HttpResponse("The image file is invalid", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing image request id {correlation_id}. Time taken: {end - start:0.4f}s")