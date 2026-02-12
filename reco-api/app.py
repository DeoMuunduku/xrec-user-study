import os
import csv
import hashlib
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# =========================
# CONFIG
# =========================

CSV_PATH = os.environ.get("RECS_CSV_PATH", "data/recs_bpr_top10.csv")

# IMPORTANT : ces clés doivent correspondre aux clés RESTAURANTS côté web (App.jsx)
# Ex: RESTAURANTS = { ulele: {...}, duchess: {...}, ... }
RESTAURANT_KEYS = os.environ.get("RESTAURANT_KEYS", "ulele,duchess").split(",")

# CORS (ajoute tes ports locaux ici)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "https://xrec-user-study.onrender.com",
    "https://xrec-user-study-reco.onrender.com",
]

app = FastAPI(title="xrec reco-api")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# LOAD CSV (user_id -> topK items)
# =========================

# Map: user_id -> list of items [{item_id, rank, score}]
RECS_BY_USER: Dict[str, List[Dict[str, Any]]] = {}
LOAD_ERROR: Optional[str] = None


def _safe_float(x: str) -> float:
    try:
        return float(x)
    except Exception:
        return 0.0


def load_csv(path: str) -> Dict[str, List[Dict[str, Any]]]:
    out: Dict[str, List[Dict[str, Any]]] = {}
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            u = (row.get("user_id") or "").strip()
            if not u:
                continue
            item_id = (row.get("item_id") or "").strip()
            rank = int((row.get("rank") or "0").strip() or 0)
            score = _safe_float((row.get("score") or "0").strip())
            out.setdefault(u, []).append({"item_id": item_id, "rank": rank, "score": score})
    # tri par rank
    for u in out:
        out[u].sort(key=lambda x: x["rank"])
    return out


def stable_bucket(key: str, n: int) -> int:
    """Renvoie un index 0..n-1 déterministe à partir d'une clé (stable, pas random)."""
    if n <= 0:
        return 0
    h = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % n


def choose_restaurant_key(participant_id: str, selected_cues: List[str]) -> str:
    """
    Mapping déterministe :
    - dépend de participant_id + selected_cues (donc si l'user refait le même choix => même resto)
    - différent si les cues changent
    """
    keys = [k.strip() for k in RESTAURANT_KEYS if k.strip()]
    if not keys:
        return "ulele"
    cues_norm = sorted([c.strip() for c in selected_cues if c and isinstance(c, str)])
    signature = f"{participant_id}::" + "|".join(cues_norm)
    idx = stable_bucket(signature, len(keys))
    return keys[idx]


@app.on_event("startup")
def _startup():
    global RECS_BY_USER, LOAD_ERROR
    if os.path.exists(CSV_PATH):
        try:
            RECS_BY_USER = load_csv(CSV_PATH)
            LOAD_ERROR = None
            print(f"[reco-api] Loaded {len(RECS_BY_USER)} users from {CSV_PATH}")
        except Exception as e:
            LOAD_ERROR = f"csv load error: {e}"
            RECS_BY_USER = {}
            print(f"[reco-api] ERROR loading CSV: {LOAD_ERROR}")
    else:
        LOAD_ERROR = f"csv not found: {CSV_PATH}"
        RECS_BY_USER = {}
        print(f"[reco-api] WARNING: {LOAD_ERROR}")


# =========================
# API MODELS
# =========================

class RecommendFromPrefsIn(BaseModel):
    participantId: str
    selectedCues: List[str] = []


# =========================
# ROUTES
# =========================

@app.get("/health")
def health():
    return {
        "ok": True,
        "csv_path": CSV_PATH,
        "loaded_users": len(RECS_BY_USER),
        "load_error": LOAD_ERROR,
        "restaurant_keys": [k.strip() for k in RESTAURANT_KEYS if k.strip()],
    }


@app.get("/recommend")
def recommend(
    user_id: str = Query("demo", description="user_id (participantId côté web)"),
    k: int = Query(10, ge=1, le=50),
):
    """
    2 modes :
    1) Si user_id existe dans le CSV => renvoie le top-k du CSV (item_id = ids Yelp originaux)
    2) Sinon => fallback déterministe vers une clé restaurant (ex: 'ulele')
       (utile tant que tu n’as pas encore le mapping Yelp -> RESTAURANTS)
    """
    if user_id in RECS_BY_USER:
        items = RECS_BY_USER[user_id][:k]
        return {"user_id": user_id, "k": min(k, len(items)), "items": items, "mode": "csv"}

    # fallback déterministe sur RESTAURANT_KEYS, basé seulement sur user_id
    chosen = choose_restaurant_key(user_id, selected_cues=[])
    return {
        "user_id": user_id,
        "k": 1,
        "items": [{"item_id": chosen, "rank": 1, "score": 1.0}],
        "mode": "fallback_restaurant_key",
    }


@app.post("/recommend_from_prefs")
def recommend_from_prefs(inp: RecommendFromPrefsIn):
    """
    Mapping déterministe participantId + selectedCues -> restaurant key
    C’est CE endpoint que tu veux si tu veux que:
    - ABC => resto1
    - BCD => resto2
    et si l'user refait la même sélection => même resto.
    """
    chosen = choose_restaurant_key(inp.participantId, inp.selectedCues)
    return {
        "user_id": inp.participantId,
        "k": 1,
        "items": [{"item_id": chosen, "rank": 1, "score": 1.0}],
        "mode": "prefs_mapping",
        "selectedCues": inp.selectedCues,
    }
