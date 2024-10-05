import io
from zipfile import ZipFile
from fractions import Fraction
import re
import requests
import base64
import mimetypes
from PIL import Image
from pint import UnitRegistry
import pillow_avif
from recipe_scrapers import scrape_html, AbstractScraper

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

def parse_image(name: str, image: bytes, resize: bool = True, mime: str = "") -> str:
    """Extracts an image from a backup file and convert to uri format
    Args:
        name (str): file name
        image (bytes): backup file
        resize (bool): whether to resize the image or not, default is True
    Returns:
        str: uri formatted base 64 file
    """
    if not mime:
        mime = guess_mime(name)
    
    image_open = Image.open(io.BytesIO(image))
    
    format = mime.lower().replace("image/", "")
    
    buffered = io.BytesIO()
    if resize:
        image_open.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        image_open.save(buffered, format=format)
    else:
        image_open.save(buffered, format=format)
        
    return ("data:" +  mime + ";" + "base64," + base64.b64encode(buffered.getvalue()).decode())

def guess_mime(file_name: str) -> str:
    """Guesses the mime type of a file
    Args:
        file_name (str): file name
    Returns:
        str: mime type
    """

    result = mimetypes.MimeTypes().guess_type(file_name)[0]

    # avif does not show in the mime types until python 3.11
    # we will upgrade soon, but this is enough for now.
    if not result and file_name.endswith(".avif"):
        result = "image/avif"
    
    return result

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

request_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Priority": "u=0;i",
    "Sec-Fetch-Ua": '"Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "Linux",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1"
}

def get_recipe_image(image_url: str):
    """Pulls an image from a web server and formats the result in URI and base64
    Args:
        image_url (str): URL of the image to pull
    Returns:
        str: URI in base64
    """    
    response = requests.get(image_url, headers=request_headers)
    parsedImage = parse_image(response.url, response.content, False, response.headers['Content-Type'])
    return parsedImage


def get_html(url: str) -> AbstractScraper:
    html = requests.get(url, headers=request_headers).content

    return scrape_html(html, url, wild_mode=True)