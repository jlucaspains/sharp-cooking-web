import logging
import jsonschema
from jsonschema import validate
from uuid import uuid4
from time import perf_counter

import azure.functions as func
from azurefunctions.extensions.http.fastapi import Request, StreamingResponse

from .models import assistantSchema

bp = func.Blueprint()

def generate_count():
    """Generate a stream of chronological numbers."""
    count = 0
    while count < 10:
        yield f"counting, {count}\n\n"
        count += 1

@bp.route(route="assistant", methods=[func.HttpMethod.POST]) 
async def assistant(req: Request) -> StreamingResponse:
    start = perf_counter()
    correlation_id = uuid4()

    try:
        logging.info(f"processing assistant request id {correlation_id}")

        req_body = await req.json()
        validate(instance=req_body, schema=assistantSchema)

        return StreamingResponse(generate_count(), media_type="text/event-stream")

        # return func.HttpResponse(result, status_code=200, mimetype="application/json")
    except jsonschema.exceptions.ValidationError as e:
        logging.error(f"Failed to process assistant request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could not assistant recipe because the data provided is invalid. Please try again.", status_code=400)
    except Exception as e:
        logging.error(f"Failed to process assistant request id {correlation_id}. Error: {e}")

        return func.HttpResponse("Could assistant the recipe due to an internal issue. Please try again.", status_code=400)
    finally:
        end = perf_counter()
        logging.info(f"Finished processing assistant request id {correlation_id}. Time taken: {end - start:0.4f}s")