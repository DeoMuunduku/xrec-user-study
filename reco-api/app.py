# /Users/deomunduku/xrec-user-study/reco-api/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import csv
import zlib

app = FastAPI(title="xrec reco-api")

# ----------------------------
# CORS (IMPORTANT for browser)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local Vite ports (add more if needed)
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        # Render front
        "https://xrec-user-study.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Config
# ----------------------------
CSV_PATH = os.getenv("RECS_CSV_PATH", "data/recs_bpr_top10.csv")

# 30 restaurants keys used by the WEB (must match App.jsx RESTAURANTS keys)
RESTAURANT_KEYS = [f"r{i:02d}" for i in range(1, 31)]

# Optional: load CSV recommendations (your existing /recommend endpoint)
USER_TO_ITEMS: Dict[str, List[str]] = {}
LOAD_ERROR: Optional[str] = None


def load_csv_recs(path: str) -> None:
    global USER_TO_ITEMS, LOAD_ERROR
    USER_TO_ITEMS = {}
    LOAD_ERROR = None
    try:
        if not os.path.exists(path):
            LOAD_ERROR = f"CSV not found: {path}"
            return

        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            # expected columns might be: user_id,item_id,rank,score ...
            # We'll accept any with at least user_id + item_id
            for row in reader:
                uid = str(row.get("user_id", "")).strip()
                iid = str(row.get("item_id", "")).strip()
                if not uid or not iid:
                    continue
                USER_TO_ITEMS.setdefault(uid, []).append(iid)

    except Exception as e:
        LOAD_ERROR = str(e)


load_csv_recs(CSV_PATH)

# ----------------------------
# Models
# ----------------------------
class RecommendFromPrefsIn(BaseModel):
    participantId: str
    selectedCues: List[str] = Field(default_factory=list)


# ----------------------------
# Helpers
# ----------------------------
def stable_pick_restaurant(participant_id: str, selected_cues: List[str]) -> str:
    """
    Deterministic mapping:
    - depends on participantId + sorted selectedCues
    - returns one key among r01..r30
    """
    cues = sorted([c.strip() for c in selected_cues if str(c).strip()])
    base = f"{participant_id}|{','.join(cues)}"
    h = zlib.crc32(base.encode("utf-8"))  # stable across runs
    idx = h % len(RESTAURANT_KEYS)
    return RESTAURANT_KEYS[idx]


# ----------------------------
# Endpoints
# ----------------------------
@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "csv_path": CSV_PATH,
        "loaded_users": len(USER_TO_ITEMS),
        "load_error": LOAD_ERROR,
        "restaurant_keys": RESTAURANT_KEYS,
    }


@app.get("/recommend")
def recommend(user_id: str = "demo", k: int = 10) -> Dict[str, Any]:
    """
    Existing endpoint:
    1) If user_id exists in CSV => top-k from CSV
    2) else fallback deterministic => r01..r30 (NOT ulele)
    """
    k = max(1, min(int(k), 50))

    if user_id in USER_TO_ITEMS and USER_TO_ITEMS[user_id]:
        items = USER_TO_ITEMS[user_id][:k]
        return {
            "user_id": user_id,
            "k": k,
            "items": [{"item_id": iid, "rank": i + 1, "score": 1.0} for i, iid in enumerate(items)],
            "mode": "csv",
        }

    picked = stable_pick_restaurant(user_id, [])
    return {
        "user_id": user_id,
        "k": 1,
        "items": [{"item_id": picked, "rank": 1, "score": 1.0}],
        "mode": "fallback",
    }


@app.post("/recommend_from_prefs")
def recommend_from_prefs(inp: RecommendFromPrefsIn) -> Dict[str, Any]:
    """
    THIS is your main endpoint:
    - same cues => same restaurant
    - different cues => often different restaurant
    """
    picked = stable_pick_restaurant(inp.participantId, inp.selectedCues)
    return {
        "user_id": inp.participantId,
        "k": 1,
        "items": [{"item_id": picked, "rank": 1, "score": 1.0}],
        "mode": "prefs_mapping",
        "selectedCues": inp.selectedCues,
    }