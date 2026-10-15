"""Supporter router for donations, contributions, and Stripe integration."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from pydantic import BaseModel

from app.config import settings
from app.models.user import User
from app.utils.dependencies import get_current_active_user, get_optional_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/supporter", tags=["Supporter & Stripe"])


class ContributionRequest(BaseModel):
    amount_cents: int = 1500  # Default $15.00
    currency: str = "aud"
    supporter_name: Optional[str] = None
    supporter_email: Optional[str] = None
    comments: Optional[str] = None
    frequency: str = "one_time"  # 'one_time' or 'monthly'


@router.get("/config")
async def get_supporter_config():
    """Returns Stripe publishable key and app metadata for supporter contributions."""
    return {
        "stripe_publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        "app_tag": settings.APP_TAG,
        "project_name": "TeachMeHealth LMS",
        "default_currency": "aud",
        "supported_amounts": [1000, 2500, 5000, 10000],
    }


@router.post("/create-checkout-session")
async def create_checkout_session(
    data: ContributionRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Creates a Stripe Checkout Session for supporter contributions.
    Includes app_tag='healthlms' in metadata.
    """
    user_email = current_user.email if current_user else (data.supporter_email or "supporter@teachmehealth.org")
    user_name = current_user.full_name if current_user else (data.supporter_name or "TeachMeHealth Supporter")
    user_id = str(current_user.id) if current_user else "anonymous"

    stripe_url = "https://api.stripe.com/v1/checkout/sessions"
    auth = (settings.STRIPE_SECRET_KEY, "")

    payload = {
        "payment_method_types[0]": "card",
        "mode": "payment",
        "customer_email": user_email,
        "line_items[0][price_data][currency]": data.currency.lower(),
        "line_items[0][price_data][unit_amount]": str(data.amount_cents),
        "line_items[0][price_data][product_data][name]": f"TeachMeHealth Supporter Contribution - {settings.APP_TAG.upper()}",
        "line_items[0][price_data][product_data][description]": "Supporting open medical education & health AI learning.",
        "line_items[0][quantity]": "1",
        "success_url": "http://localhost:3000/?supporter_status=success",
        "cancel_url": "http://localhost:3000/?supporter_status=cancelled",
        "metadata[app_tag]": settings.APP_TAG,
        "metadata[role]": "supporter",
        "metadata[user_id]": user_id,
        "metadata[user_name]": user_name,
        "metadata[comments]": data.comments or "",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(stripe_url, data=payload, auth=auth, timeout=20.0)
            if resp.status_code >= 400:
                logger.error(f"Stripe error: {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Stripe session error: {resp.json().get('error', {}).get('message', 'Failed to initialize payment')}",
                )
            result = resp.json()
            return {
                "checkout_url": result.get("url"),
                "session_id": result.get("id"),
                "app_tag": settings.APP_TAG,
            }
    except httpx.RequestError as exc:
        logger.error(f"Network error calling Stripe: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to connect to Stripe payment gateway.",
        )
