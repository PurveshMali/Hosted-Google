import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Import our new routers
from auth_router import router as auth_router
from ngo_team_router import router as ngo_team_router
from needs_router import router as needs_router
from tasks_router import router as tasks_router
from notifications_router import router as notifications_router

load_dotenv()

app = FastAPI(title="CommunityPulse API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://hosted-google-git-main-purvesh-malis-projects.vercel.app",
        "https://hosted-google-g3ii.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handling Middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        print(f"DEBUG: {request.method} {request.url.path}")
        return await call_next(request)
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )

# Include Routers
app.include_router(auth_router)
app.include_router(ngo_team_router)
app.include_router(needs_router)
app.include_router(tasks_router)
app.include_router(notifications_router)

@app.get("/")
async def root():
    return {"message": "CommunityPulse API is running"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
