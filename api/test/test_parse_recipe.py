import json
import azure.functions as func

from ..functions.parse_recipe import parse_recipe

# parse recipe post method
def test_recipe_parse():
    request = func.HttpRequest(
        method='POST',
        url='api/parse-recipe',
        body=json.dumps({
            'url': 'https://www.foodnetwork.com/recipes/rachael-ray/pork-chops-with-golden-apple-sauce-recipe-1915826',
        }).encode('utf8')
    )

    func_call = parse_recipe.build().get_user_function()
    response = func_call(request)
    
    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())
    assert parsed_response["title"] == "Pork Chops with Golden Apple Sauce"
    assert len(parsed_response["ingredients"]) == 12
    assert parsed_response["ingredients"][1]["raw"] == "2 teaspoons lemon juice"
    assert parsed_response["ingredients"][1]["quantity"] == 2
    assert parsed_response["ingredients"][1]["unit"] == "teaspoon"
    
    assert len(parsed_response["steps"]) == 2
    assert parsed_response["steps"][0]["minutes"] == 12
    
    assert parsed_response["image"].startswith("http")

    assert parsed_response["language"] == "en"

    assert parsed_response["nutrients"]["calories"] == 423
    assert parsed_response["nutrients"]["totalFat"] == 19
    assert parsed_response["nutrients"]["saturatedFat"] == 6
    assert parsed_response["nutrients"]["carbohydrates"] == 39
    assert parsed_response["nutrients"]["protein"] == 26
    assert parsed_response["nutrients"]["cholesterol"] == 83
    assert parsed_response["nutrients"]["sodium"] == 832

def test_recipe_parse_download_image():
    request = func.HttpRequest(
        method='POST',
        url='api/parse-recipe',
        body=json.dumps({
            'url': 'https://www.foodnetwork.com/recipes/rachael-ray/pork-chops-with-golden-apple-sauce-recipe-1915826',
            "downloadImage": True
        }).encode('utf8')
    )
    
    func_call = parse_recipe.build().get_user_function()
    response = func_call(request)

    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())
    assert parsed_response["title"] == "Pork Chops with Golden Apple Sauce"
    assert len(parsed_response["ingredients"]) == 12
    assert parsed_response["ingredients"][1]["raw"] == "2 teaspoons lemon juice"
    assert parsed_response["ingredients"][1]["quantity"] == 2
    assert parsed_response["ingredients"][1]["unit"] == "teaspoon"
    
    assert len(parsed_response["steps"]) == 2
    assert parsed_response["steps"][0]["minutes"] == 12
    
    assert parsed_response["image"].startswith("data:")

def test_recipe_parse_exception():
    request = func.HttpRequest(
        method='POST',
        url='api/parse-recipe',
        body=json.dumps({
            "url": "https://www.foodnk.com/recipes/rachael-ray/pork-chops-with-golden-apple-sauce-recipe-1915826",
        }).encode('utf8')
    )
    
    func_call = parse_recipe.build().get_user_function()
    response = func_call(request)

    assert response.status_code == 400
    parsed_response = response.get_body().decode()
    assert parsed_response == r'Could not find a recipe in the web page'
