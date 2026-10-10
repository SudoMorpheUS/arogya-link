from fastapi import FastAPI

from src.core.config import DEBUG

app = FastAPI(title="Aarogya-Link API")

if DEBUG:
    from src.routers.debug import router as debug_router

    app.include_router(debug_router)


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}
