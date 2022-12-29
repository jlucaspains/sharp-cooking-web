import io
from zipfile import ZipFile
from recipe_scrapers import scrape_me
from fractions import Fraction
import re
import requests
import base64
import mimetypes
from PIL import Image
from pint import UnitRegistry

def parse_recipe_ingredients(text: str, ureg: UnitRegistry):
    """Parses a recipe collection of ingredientes that are formatted in a single string separated by \n
    Args:
        text (str): ingredients
    Returns:
        list: list of ingredients with raw, unit, and quantity
    """
    ingredients = text.split("\n")
    
    result = []
    for ingredient in ingredients:
        if ingredient and not ingredient.isspace():
            result.append(parse_recipe_ingredient(ingredient, "en", ureg))
    
    return result

def parse_recipe_instructions(text: str):
    """Parses a recipe collection of instructions that are formatted in a single string separated by \n
    Args:
        text (str): instructions
    Returns:
        list: list of instructions with raw and time
    """    
    instructions = text.split("\n")
    
    result = []
    for instruction in instructions:
        if instruction and not instruction.isspace():
            result.append(parse_recipe_instruction(instruction, "en"))
    
    return result    

def parse_image(name: str, image: bytes, resize: bool = True) -> str:
    """Extracts an image from a backup file and convert to uri format
    Args:
        name (str): file name
        image (bytes): backup file
        resize (bool): whether to resize the image or not, default is True
    Returns:
        str: uri formatted base 64 file
    """
    mime = mimetypes.MimeTypes().guess_type(name)[0]
    image_open = Image.open(io.BytesIO(image))
    
    format = mime.lower().replace("image/", "")
    
    buffered = io.BytesIO()
    if resize:
        image_open.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        image_open.save(buffered, format=format)
    else:
        image_open.save(buffered, format=format)
        
    return ("data:" +  mime + ";" + "base64," + base64.b64encode(buffered.getvalue()).decode())

def parse_recipe_ingredient(text: str, lang: str, ureg: UnitRegistry):
    """Parses a single recipe ingredient
    Args:
        text (str): the ingredient e.g. 10 grams flour
        lang (str): language the ingredient is in
    Returns:
        dictionary: raw text, quantity parsed, unit identified
    """
    text = replace_unicode_fractions(text)
    qty_re = re.search(r"^(?P<Value>\d{1,5}\s\d{1,5}\/\d{1,5}|\d{1,5}\/\d{1,5}|\d{1,5}\.?\d{0,5})\d*\s?(?P<Unit>\w*\b)",
                    text)

    if not qty_re:
        return { "raw": text, "quantity": 0, "unit": "" }

    value = qty_re.group("Value")
    unit = qty_re.group("Unit")
    
    unit_value = ""
    if unit and unit in ureg:
        unit_value = ureg.get_name(unit)

    parts = value.split(" ")
    
    if parts.__len__() == 2:
        whole = int(parts[0])
        fraction = Fraction(parts[1])
        return { "raw": text, "quantity": whole + float(fraction).__round__(2), "unit": unit_value }
    
    if parts[0].count("/") == 1:
        fraction = Fraction(parts[0])
        return { "raw": text, "quantity": float(fraction).__round__(2), "unit": unit_value }
        
    regular = parts[0]
    return { "raw": text, "quantity": float(regular), "unit": unit_value }

def replace_unicode_fractions(text: str):
    """Replaces unicode based fraction values such as ½ with string fractions such as 1/2
    Args:
        text (str): text to search for fractions
    Returns:
        str: text with replaced fractions
    """    
    result = text.replace("½", "1/2")
    result = result.replace("¼", "1/4")
    result = result.replace("¾", "3/4")
    result = result.replace("⅓", "1/3")
    result = result.replace("⅔", "2/3")

    return result

def parse_recipe_instruction(text: str, lang: str):
    """Parses a single recipe instruction
    Args:
        text (str): knead dough for 10 minutes
        lang (str): language the instruction is in
    Returns:
        dictionary: raw instruction, minutes identified for the instruction
    """    
    qty_re = re.findall(r"(?P<Minutes>\d{1,5}\.?\d{0,5})\s*(minutes|minute|min)\b|(?P<Hours>\d{1,5}\.?\d{0,5})\s*(hours|hour)\b|(?P<Days>\d{1,5}\.?\d{0,5})\s*(days|day)\b",
                    text)
    minutes = 0
    
    for match in qty_re:
        minutes += float(match[0] or "0")
        minutes += float(match[2] or "0") * 60
        minutes += float(match[4] or "0") * 24 * 60
    
    return { "raw": text, "minutes": minutes }

def parse_recipe_image(image_url: str):
    """Pulls an image from a web server and formats the result in URI and base64
    Args:
        image_url (str): URL of the image to pull
    Returns:
        str: URI in base64
    """    
    response = requests.get(image_url)
    return ("data:" +  response.headers['Content-Type'] + ";" + "base64," + base64.b64encode(response.content).decode("utf-8"))