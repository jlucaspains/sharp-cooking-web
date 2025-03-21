import json
import azure.functions as func

from unittest import mock;

from ..functions.share_recipe import share_recipe, mock_repository

share_url = 'api/share-recipe'

def test_share_recipe_success():
    request = func.HttpRequest(
        method='POST',
        url=share_url,
        body=json.dumps({
            "title": "1",
            "ingredients": ["1 cup of flour"],
            "steps": ["bake it"],
            "media": [{"type": "img", "url": "pseudoimage"}]
        }).encode('utf8')
    )

    mock_repository(mock.MagicMock())
    
    func_call = share_recipe.build().get_user_function()
    response = func_call(request)
    
    assert response.status_code == 202
    parsed_response = json.loads(response.get_body().decode())

    assert len(parsed_response["id"]) == 6
    assert parsed_response["qr_code"].startswith("<svg")
    assert parsed_response["ttl"] == 3600

def test_share_recipe_bad_data():
    request = func.HttpRequest(
        method='POST',
        url=share_url,
        body=json.dumps({
            "title": "1",
            "ingredients": ["1 cup of flour"]
        }).encode('utf8')
    )

    mock_repository(mock.MagicMock())
    
    func_call = share_recipe.build().get_user_function()
    response = func_call(request)
    
    assert response.status_code == 400
    assert response.get_body().decode() == "Could not share recipe because the data provided is invalid. Please try again."

def test_share_recipe_bad_data2():
    request = func.HttpRequest(
        method='POST',
        url=share_url,
        body=json.dumps({
            "title": "1",
            "steps": ["bake it"]
        }).encode('utf8')
    )

    mock_repository(mock.MagicMock())
    
    func_call = share_recipe.build().get_user_function()
    response = func_call(request)
    
    assert response.status_code == 400
    assert response.get_body().decode() == "Could not share recipe because the data provided is invalid. Please try again."


def test_share_recipe_internal_error():
    request = func.HttpRequest(
        method='POST',
        url=share_url,
        body=json.dumps({
            "title": "1",
            "ingredients": ["1 cup of flour"],
            "steps": ["bake it"]
        }).encode('utf8')
    )

    repository = mock.MagicMock()
    repository.create_item.side_effect = mock.Mock(side_effect=Exception('Test'))
    mock_repository(repository)
    
    func_call = share_recipe.build().get_user_function()
    response = func_call(request)
    
    assert response.status_code == 400
    assert response.get_body().decode() == "Could share the recipe due to an internal issue. Please try again."