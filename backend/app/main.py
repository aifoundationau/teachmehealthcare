import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routers import auth, images, annotations, comments, ai, search, supporter, scholar

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    await init_db()
    yield

app = FastAPI(
    title="TeachMeHealth API",
    description="Medical imaging AI platform for uploading, annotating, and analyzing medical images.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API route modules
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(supporter.router, prefix="/api", tags=["Supporter & Stripe"])
app.include_router(images.router, prefix="/api/images", tags=["Medical Images"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["Annotations"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI & RAG"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(scholar.router, prefix="/api", tags=["Google Scholar & Academic Search"])

@app.get("/")
async def root():
    return {"message": "TeachMeHealth API is running"}