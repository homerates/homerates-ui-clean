# myapp/routes/api_routes.py

from fastapi import APIRouter, HTTPException
import logging

from myapp.fred_client import FredClient
from myapp.tavily_client import TavilyClient

logger = logging.getLogger(__name__)
router = APIRouter()

def get_fred_client():
    return FredClient()

def get_tavily_client():
    return TavilyClient()

@router.get("/api/fred/{series_id}")
def get_series(series_id: str, start: str = None, end: str = None):
    fred = get_fred_client()
    try:
        series = fred.get_series(series_id, observation_start=start, observation_end=end)
    except Exception as e:
        logger.error(f"Error fetching FRED series {series_id}: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch FRED data")
    return {"series_id": series_id, "data": series.to_dict()}

@router.get("/api/tavily/search")
def tavily_search(q: str):
    tavily = get_tavily_client()
    try:
        result = tavily.get_something("search", params={"query": q})
    except Exception as e:
        logger.error(f"Tavily search error for query '{q}': {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch Tavily data")
    return {"query": q, "result": result}

@router.get("/api/test-both")
def test_both():
    fred = get_fred_client()
    tavily = get_tavily_client()

    data = {}
    try:
        data["fred"] = fred.get_series("UNRATE", observation_start="2020-01-01", observation_end="2020-12-01").to_dict()
    except Exception as e:
        logger.error(f"Error in FRED part of test_both: {e}")
        raise HTTPException(status_code=500, detail="FRED part failed")

    try:
        data["tavily"] = tavily.get_something("search", params={"query": "test"})
    except Exception as e:
        logger.error(f"Error in Tavily part of test_both: {e}")
        raise HTTPException(status_code=500, detail="Tavily part failed")

    return data
