import os
from typing import Any, Dict
from azure.cosmos import CosmosClient

DATABASE_NAME = "sharp-cooking"
CONTAINER_NAME = "ShareItems"

class Repository:
    def connect(self):
        endpoint = os.environ.get("COSMOS_ENDPOINT")
        key = os.environ.get("COSMOS_KEY")

        if endpoint is None or key is None:
            return
        
        self.client = CosmosClient(url=endpoint, credential=key)
        self.database = self.client.get_database_client(DATABASE_NAME)
        self.container = self.database.get_container_client(CONTAINER_NAME)

    @property
    def connected(self) -> bool:
        return hasattr(self, 'container') and self.container is not None

    def read_item(self, id: str) -> Dict[str, Any]:
        return self.container.read_item(id, partition_key=id)
    
    def create_item(self, item: Dict[str, Any]):
        self.container.create_item(item)