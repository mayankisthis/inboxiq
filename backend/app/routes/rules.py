from fastapi import APIRouter, HTTPException, Request

from app.services.auth_service import get_session_user
from app.services.rules_service import load_rules, save_rules

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("")
def get_rules(request: Request):
  user = get_session_user(request)
  if not user.get("authenticated"):
    raise HTTPException(status_code=401, detail="Not authenticated")
  
  email = user.get("email")
  if not email:
    raise HTTPException(status_code=400, detail="User email not found in session")
    
  return {"rules": load_rules(email)}


@router.post("")
async def update_rules(request: Request):
  user = get_session_user(request)
  if not user.get("authenticated"):
    raise HTTPException(status_code=401, detail="Not authenticated")
  
  email = user.get("email")
  if not email:
    raise HTTPException(status_code=400, detail="User email not found in session")
    
  try:
    body = await request.json()
    rules = body.get("rules", [])
    save_rules(email, rules)
    return {"status": "ok", "rules": rules}
  except Exception as exc:
    raise HTTPException(status_code=400, detail=f"Invalid request format: {exc}") from exc
