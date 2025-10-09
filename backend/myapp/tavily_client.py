# myapp/tavily_client.py

import os
import requests

class TavilyClient:
    def __init__(self):
        key = os.environ.get("TAVILY_API_KEY")
        if not key:
            raise RuntimeError("TAVILY_API_KEY is not set")
        self.api_key = key
        self.base_url = "https://api.tavily.com"

    def get_something(self, endpoint: str, params: dict = {}):
        url = f"{self.base_url}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        response = requests.post(url, headers=headers, json=params, timeout=10)
        response.raise_for_status()
        return response.json()
