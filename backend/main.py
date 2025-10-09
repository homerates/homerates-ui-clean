# main.py

from pathlib import Path
from dotenv import load_dotenv
import os

from fastapi import FastAPI

# Load environment variables from .env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

from myapp.logging_config import setup_logging

# Setup logging before other imports
setup_logging()
logger = logging.getLogger(__name__)

from myapp.routes.api_routes import router as api_router

app = FastAPI()

app.include_router(api_router)

logger.info("App startup complete")
