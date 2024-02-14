import json
import os
import azure.functions as func
from azure.cosmos import errors

from unittest import mock;

from ..receive_recipe.main import main, mock_repository

receive_url = 'api/receive-recipe'

def test_receive_recipe_success():
    request = func.HttpRequest(
        method='POST',
        url=receive_url,
        body=json.dumps({
            "code": "123456"
        }).encode('utf8')
    )

    repository = mock.MagicMock()
    repository.read_item.return_value= {
            "id": '123456',
            "title": "title",
            "notes": "notes",
            "ingredients": ["1 cup of flour"],
            "steps": ["bake it"],
            "source": "source",
            "media": [{"type": "img", "url": "pseudoimage"}]
        }
    
    mock_repository(repository)
    
    response = main(request)
    
    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())

    assert parsed_response["id"] == "123456"
    assert parsed_response["title"] == "title"
    assert parsed_response["notes"] == "notes"
    assert parsed_response["ingredients"] == ["1 cup of flour"]
    assert parsed_response["steps"] == ["bake it"]
    assert parsed_response["source"] == "source"
    assert parsed_response["media"] == [{"type": "img", "url": "pseudoimage"}]

def test_receive_recipe_not_found():
    request = func.HttpRequest(
        method='POST',
        url=receive_url,
        body=json.dumps({
            "code": "123456"
        }).encode('utf8')
    )

    repository = mock.MagicMock()
    repository.read_item.side_effect = mock.Mock(side_effect=errors.CosmosResourceNotFoundError(404))
    
    mock_repository(repository)
    
    response = main(request)
    
    assert response.status_code == 404

    assert response.get_body().decode() == "Could not receive the recipe because it does not exist."


def test_receive_recipe_exception():
    request = func.HttpRequest(
        method='POST',
        url=receive_url,
        body=json.dumps({
            "code": "1"
        }).encode('utf8')
    )

    repository = mock.MagicMock()
    repository.read_item.side_effect = mock.Mock(side_effect=Exception("Test"))
    
    mock_repository(repository)
    
    response = main(request)
    
    assert response.status_code == 400

    assert response.get_body().decode() == "Could not receive the recipe due to an internal issue. Please try again."