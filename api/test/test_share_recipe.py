import os
import unittest, json, importlib
import azure.functions as func

from unittest import mock;

from ..share_recipe.main import main, mock_repository

def test_share_recipe_success():
    request = func.HttpRequest(
        method='POST',
        url='api/share-recipe',
        body=json.dumps({
            "title": "1",
            "ingredients": ["1 cup of flour"],
            "steps": ["bake it"],
            "images": ["pseudoimage"]
        }).encode('utf8')
    )

    mock_repository(mock.MagicMock())
    
    response = main(request)
    
    assert response.status_code == 202
    parsed_response = json.loads(response.get_body().decode())

    assert len(parsed_response["id"]) == 6
    assert parsed_response["ttl"] == 3600

def test_share_recipe_bad_data():
    request = func.HttpRequest(
        method='POST',
        url='api/share-recipe',
        body=json.dumps({
            "title": "1",
            "ingredients": ["1 cup of flour"]
        }).encode('utf8')
    )

    mock_repository(mock.MagicMock())
    
    response = main(request)
    
    assert response.status_code == 400
    assert response.get_body().decode() == "Could not share recipe because the data provided is invalid. Please try again."

def test_share_recipe_bad_data2():
    request = func.HttpRequest(
        method='POST',
        url='api/share-recipe',
        body=json.dumps({
            "title": "1",
            "steps": ["bake it"]
        }).encode('utf8')
    )

    mock_repository(mock.MagicMock())
    
    response = main(request)
    
    assert response.status_code == 400
    assert response.get_body().decode() == "Could not share recipe because the data provided is invalid. Please try again."


def test_share_recipe_internal_error():
    request = func.HttpRequest(
        method='POST',
        url='api/share-recipe',
        body=json.dumps({
            "title": "1",
            "ingredients": ["1 cup of flour"],
            "steps": ["bake it"]
        }).encode('utf8')
    )

    repository = mock.MagicMock()
    repository.create_item.side_effect = mock.Mock(side_effect=Exception('Test'))
    mock_repository(repository)
    
    response = main(request)
    
    assert response.status_code == 400
    assert response.get_body().decode() == "Could share the recipe due to an internal issue. Please try again."