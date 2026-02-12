from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/recommend")
def recommend(user_id: str = "demo"):
    # TODO: ici tu brancheras ton modèle de reco plus tard
    return {
        "user_id": user_id,
        "items": [
            {"item_id": "resto_1", "score": 0.91},
            {"item_id": "resto_2", "score": 0.87},
            {"item_id": "resto_3", "score": 0.80},
        ],
    }
