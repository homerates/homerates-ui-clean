# myapp/logging_config.py

import logging
import sys
from logging.config import dictConfig

def setup_logging():
    """
    Configure structured logging for the application.
    """
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "level": "INFO",
                "stream": "ext://sys.stdout",
            },
            # Optionally, you can add a file handler or rotating file handler here
            # "file": {
            #     "class": "logging.handlers.RotatingFileHandler",
            #     "formatter": "default",
            #     "level": "DEBUG",
            #     "filename": "app.log",
            #     "maxBytes": 10485760,
            #     "backupCount": 5,
            # },
        },
        "root": {
            "handlers": ["console"],
            "level": "INFO",
        },
    }

    dictConfig(log_config)
