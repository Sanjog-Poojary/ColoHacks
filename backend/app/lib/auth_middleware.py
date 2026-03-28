from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as admin_auth
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    token = res.credentials
    try:
        decoded_token = admin_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f'Auth verification failed: {str(e)}')
        raise HTTPException(status_code=401, detail='Invalid or expired auth token')