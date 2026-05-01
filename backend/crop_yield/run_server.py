import uvicorn
from pathlib import Path


if __name__ == "__main__":
    # Ensure relative model and module paths resolve even when launched from another cwd.
    script_dir = Path(__file__).resolve().parent
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8010,
        reload=True,
        log_level="info",
        app_dir=str(script_dir),
    )
