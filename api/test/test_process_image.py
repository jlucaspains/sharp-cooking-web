import unittest, json, importlib
import azure.functions as func

from unittest import mock;

from ..process_image.main import main

def test_process_image():
    mock_request = mock.MagicMock()
    mock_request.method='POST'
    mock_request.url='api/process-image'
    files_mock = mock.MagicMock()
    files_mock.values.return_value = [type('',(object,),{"filename": "test_image.jpeg","stream": open("test/test_image.jpeg", "rb"),"content_type": "image/jpeg"})()]
    type(mock_request).files = mock.PropertyMock(return_value=files_mock)
    
    response = main(mock_request)
    
    assert response.status_code == 200
    parsed_response = json.loads(response.get_body().decode())
    
    assert parsed_response["name"] == "test_image.jpeg"
    assert parsed_response["image"].startswith("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD")

def test_process_image_bad_mime():
    mock_request = mock.MagicMock()
    mock_request.method='POST'
    mock_request.url='api/process-image'
    files_mock = mock.MagicMock()
    files_mock.values.return_value = [type('',(object,),{"filename": "test_image.jpeg","stream": open("test/test_image.jpeg", "rb"),"content_type": "application/jpeg"})()]
    type(mock_request).files = mock.PropertyMock(return_value=files_mock)
    
    response = main(mock_request)
    
    assert response.status_code == 400
    parsed_response = response.get_body().decode()
    
    assert parsed_response == "Only image files are accepted"


def test_process_image_no_file():
    mock_request = mock.MagicMock()
    mock_request.method='POST'
    mock_request.url='api/process-image'
    
    response = main(mock_request)
    
    assert response.status_code == 400
    parsed_response = response.get_body().decode()
    
    assert parsed_response == "A single file is required to process"