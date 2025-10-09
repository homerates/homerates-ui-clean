from fastapi import APIRouter, HTTPException
from myapp.fred_client import FredClient
# from myapp.tavily_client import TavilyClient  (if using in this file)

router = APIRouter()

def get_fred_client():
    return FredClient()

@router.get("/api/fred/{series_id}")
def get_series(series_id: str, start: str = None, end: str = None):
    fred_client = get_fred_client()
    try:
        series = fred_client.get_series(series_id, observation_start=start, observation_end=end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"series_id": series_id, "data": series.to_dict()}
