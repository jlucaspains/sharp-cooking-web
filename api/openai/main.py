import logging
import json

import azure.functions as func

from uuid import uuid4
from time import perf_counter
import openai

from ..util import parse_image


def main(req: func.HttpRequest) -> func.HttpResponse:
    start = perf_counter()
    correlation_id = uuid4()
    try:
        logging.info(f"open ai with request id {correlation_id}")

        req_body = req.get_json()
        prompt: str = req_body.get("prompt")

        # openai.organization = "Personal"
        openai.api_key = "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"
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return func.HttpResponse(json.dumps(completion.choices[0].message), status_code=200, mimetype="application/json")

        # return func.HttpResponse("A single file is required to process", status_code=400)
    except Exception as e:
        logging.error(
            f"Failed to process image request id {correlation_id}. Error: {e}")
        return func.HttpResponse("The image file is invalid", status_code=400)
    finally:
        end = perf_counter()
        logging.info(
            f"Finished processing image request id {correlation_id}. Time taken: {end - start:0.4f}s")
