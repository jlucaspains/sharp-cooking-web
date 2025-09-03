import json
import azure.functions as func

from ..functions.parse_recipe import parse_recipe, set_mock_recipe_html

# parse recipe post method
def test_recipe_parse():
    request = func.HttpRequest(
        method='POST',
        url='api/parse-recipe',
        body=json.dumps({
            'url': 'https://www.food.com/recipe/pork-chops-with-golden-applesauce-150781',
        }).encode('utf8')
    )

    mock_recipe_html = open("test/test_recipe.html", "r").read()
    set_mock_recipe_html(mock_recipe_html)

    func_call = parse_recipe.build().get_user_function()
    response = func_call(request)
    
    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())
    assert parsed_response["title"] == "Pork Chops With Golden Applesauce"
    assert len(parsed_response["ingredients"]) == 12
    assert parsed_response["ingredients"][1]["raw"] == "2 teaspoons lemon juice"
    assert parsed_response["ingredients"][1]["quantity"] == 2
    assert parsed_response["ingredients"][1]["unit"] == "teaspoon"
    
    assert len(parsed_response["steps"]) == 3
    assert parsed_response["steps"][0]["minutes"] == 20
    
    assert parsed_response["image"].startswith("http")

    assert parsed_response["language"] == "en"

    assert parsed_response["nutrients"]["calories"] == 816
    assert parsed_response["nutrients"]["totalFat"] == 33
    assert parsed_response["nutrients"]["saturatedFat"] == 11
    assert parsed_response["nutrients"]["carbohydrates"] == 82
    assert parsed_response["nutrients"]["protein"] == 50
    assert parsed_response["nutrients"]["cholesterol"] == 172
    assert parsed_response["nutrients"]["sodium"] == 191

def test_recipe_parse_download_image():
    request = func.HttpRequest(
        method='POST',
        url='api/parse-recipe',
        body=json.dumps({
            'url': 'https://www.food.com/recipe/pork-chops-with-golden-applesauce-150781',
            "downloadImage": True
        }).encode('utf8')
    )
    
    mock_recipe_html = open("test/test_recipe.html", "r").read()
    set_mock_recipe_html(mock_recipe_html)

    func_call = parse_recipe.build().get_user_function()
    response = func_call(request)

    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())
    assert parsed_response["title"] == "Pork Chops With Golden Applesauce"
    assert len(parsed_response["ingredients"]) == 12
    assert parsed_response["ingredients"][1]["raw"] == "2 teaspoons lemon juice"
    assert parsed_response["ingredients"][1]["quantity"] == 2
    assert parsed_response["ingredients"][1]["unit"] == "teaspoon"
    
    assert len(parsed_response["steps"]) == 3
    assert parsed_response["steps"][0]["minutes"] == 20
    
    assert parsed_response["image"].startswith("data:")

def test_recipe_parse_exception():
    request = func.HttpRequest(
        method='POST',
        url='api/parse-recipe',
        body=json.dumps({
            "url": "https://www.foodnk.com/recipes/rachael-ray/pork-chops-with-golden-apple-sauce-recipe-1915826",
        }).encode('utf8')
    )
    
    set_mock_recipe_html(None)

    func_call = parse_recipe.build().get_user_function()
    response = func_call(request)

    assert response.status_code == 400
    parsed_response = response.get_body().decode()
    assert parsed_response == r'Could not find a recipe in the web page'
