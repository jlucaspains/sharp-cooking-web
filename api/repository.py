import os
from typing import Any, Dict
from azure.cosmos import CosmosClient

ENDPOINT = os.environ["COSMOS_ENDPOINT"]
KEY = os.environ["COSMOS_KEY"]
DATABASE_NAME = "sharp-cooking"
CONTAINER_NAME = "Items"

class Repository:
    def __init__(self):
        self.client = CosmosClient(url=ENDPOINT, credential=KEY)
        self.database = self.client.get_database_client(DATABASE_NAME)
        self.container = self.database.get_container_client(CONTAINER_NAME)

    def read_item(self, id: str) -> Dict[str, Any]:
        return self.container.read_item(id, partition_key=id)
    
    def create_item(self, item: Dict[str, Any]):
        self.container.create_item(item)