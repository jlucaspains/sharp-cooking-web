import unittest, json, importlib
import azure.functions as func

from unittest import mock;

from ..process_backup.main import main

def test_parse_backup():
    mock_request = mock.MagicMock()
    mock_request.method='POST'
    mock_request.url='api/process-backup'
    files_mock = mock.MagicMock()
    files_mock.values.return_value = [type('',(object,),{"filename": "test_backup.zip","stream": open("test/test_backup.zip", "rb"),"content_type": "application/x-zip-compressed"})()]
    type(mock_request).files = mock.PropertyMock(return_value=files_mock)
    
    response = main(mock_request)
    
    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())
    
    assert len(parsed_response) == 1
    assert parsed_response[0]["title"] == "Carrot cake"
    assert parsed_response[0]["image"].startswith("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD")
    
    assert len(parsed_response[0]["ingredients"]) == 6
    assert parsed_response[0]["ingredients"][0]["raw"] == "3 eggs"
    assert parsed_response[0]["ingredients"][0]["quantity"] == 3
    assert parsed_response[0]["ingredients"][0]["unit"] == ""
    assert parsed_response[0]["ingredients"][1]["raw"] == "1 cup sugar"
    assert parsed_response[0]["ingredients"][1]["quantity"] == 1
    assert parsed_response[0]["ingredients"][1]["unit"] == "cup"
    
    assert len(parsed_response[0]["steps"]) == 6
    assert parsed_response[0]["steps"][0]["raw"] == "Blend carrots, vegetable oil, sugar, and eggs together for about 5 minutes till smooth"
    assert parsed_response[0]["steps"][0]["minutes"] == 5
    assert parsed_response[0]["steps"][1]["raw"] == "Sift flour on a separate container"
    assert parsed_response[0]["steps"][1]["minutes"] == 0

def test_parse_backup_bad_mime():
    mock_request = mock.MagicMock()
    mock_request.method='POST'
    mock_request.url='api/process-backup'
    files_mock = mock.MagicMock()
    files_mock.values.return_value = [type('',(object,),{"filename": "test_backup.zip","stream": open("test/test_backup.zip", "rb"),"content_type": "application/not-zip"})()]
    type(mock_request).files = mock.PropertyMock(return_value=files_mock)
    
    response = main(mock_request)

    assert response.status_code == 400
    parsed_response = response.get_body().decode()
    
    assert parsed_response == "Only zip files are acceptted"

def test_parse_backup_no_file():
    mock_request = mock.MagicMock()
    mock_request.method='POST'
    mock_request.url='api/process-backup'
    
    response = main(mock_request)

    assert response.status_code == 400
    parsed_response = response.get_body().decode()
    
    assert parsed_response == "A single file is required to process"
