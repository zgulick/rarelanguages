from fastapi import FastAPI, UploadFile, File, HTTPException
import json
import os
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for Netlify/Bolt.new frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to match your front-end URL for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the path where the JSON file is stored
DATA_FOLDER = Path("~/Downloads").expanduser()
DATA_FILE = DATA_FOLDER / "hypetorch_latest_output.json"

# Ensure data folder exists
DATA_FOLDER.mkdir(parents=True, exist_ok=True)

# Load JSON data

def load_data():
    if not DATA_FILE.exists():
        return {"message": "No data available. Upload a file first."}
    with open(DATA_FILE, "r") as f:
        return json.load(f)

# API Routes

@app.get("/api/entities")
def get_entities():
    """Return a list of all tracked entities (players, teams, brands, etc.)."""
    data = load_data()
    return list(data.get("hype_scores", {}).keys())

@app.get("/api/entities/{entity_id}")
def get_entity_details(entity_id: str):
    """Fix underscore issue by replacing `_` with spaces before looking up entity."""
    data = load_data()
    
    entity_name = entity_id.replace("_", " ")  # Convert URL-friendly names back to original

    return {
        "name": entity_id,
        "hype_score": data.get("hype_scores", {}).get(entity_name, "N/A"),
        "mentions": data.get("mention_counts", {}).get(entity_name, 0),
        "talk_time": data.get("talk_time_counts", {}).get(entity_name, 0),
        "sentiment": data.get("player_sentiment_scores", {}).get(entity_name, [])
    }

@app.get("/api/entities/{entity_id}/metrics")
def get_entity_metrics(entity_id: str):
    """Fix underscore issue before looking up entity metrics."""
    data = load_data()
    
    entity_name = entity_id.replace("_", " ")  # Convert underscores to spaces

    return {
        "mentions": data.get("mention_counts", {}).get(entity_name, 0),
        "talk_time": data.get("talk_time_counts", {}).get(entity_name, 0),
        "sentiment": data.get("player_sentiment_scores", {}).get(entity_name, [])
    }

@app.get("/api/entities/{entity_id}/trending")
def get_entity_trending(entity_id: str):
    """Fix underscore issue before looking up trending data."""
    data = load_data()
    
    entity_name = entity_id.replace("_", " ")  # Convert underscores to spaces

    return {
        "google_trends": data.get("google_trends", {}).get(entity_name, 0),
        "wikipedia_views": data.get("wikipedia_views", {}).get(entity_name, 0),
        "reddit_mentions": data.get("reddit_mentions", {}).get(entity_name, 0),
        "google_news_mentions": data.get("google_news_mentions", {}).get(entity_name, 0)
    }

@app.get("/api/last_updated")
def get_last_updated():
    """Return the last modified timestamp of the JSON file."""
    if DATA_FILE.exists():
        timestamp = os.path.getmtime(DATA_FILE)
        return {"last_updated": timestamp}
    return {"message": "No data available."}

@app.post("/api/upload_json")
def upload_json(file: UploadFile = File(...)):
    """Upload a new JSON file to update the data."""
    try:
        content = file.file.read()
        json_data = json.loads(content)
        with open(DATA_FILE, "w") as f:
            json.dump(json_data, f, indent=4)
        return {"message": "File uploaded successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
