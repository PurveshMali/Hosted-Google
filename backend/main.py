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
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# We still keep the middleware, but we'll add the manual override below for safety
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Nuclear CORS & Error Handling Middleware
@app.middleware("http")
async def safety_shield_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    # Handle OPTIONS requests (pre-flight)
    if request.method == "OPTIONS":
        response = Response()
    else:
        try:
            print(f"DEBUG: {request.method} {request.url.path}")
            response = await call_next(request)
        except Exception as e:
            print(f"❌ CRITICAL ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "error": str(e)}
            )

    # Force CORS headers on EVERY response
    target_origin = origin if origin in origins else "http://localhost:5173"
    response.headers["Access-Control-Allow-Origin"] = target_origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With"
    
    return response

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
