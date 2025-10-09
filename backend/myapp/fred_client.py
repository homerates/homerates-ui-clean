# myapp/fred_client.py

import os
from fredapi import Fred

class FredClient:
    def __init__(self):
        key = os.environ.get("FRED_API_KEY")
        if not key:
            raise RuntimeError("FRED_API_KEY is not set")
        self._fred = Fred(api_key=key)

    def get_series(self, series_id: str, observation_start: str = None, observation_end: str = None, **kwargs):
        return self._fred.get_series(series_id, observation_start=observation_start, observation_end=observation_end, **kwargs)

    def search(self, query: str):
        return self._fred.search(query)
