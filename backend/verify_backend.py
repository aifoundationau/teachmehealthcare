import asyncio
from app.config import settings
from app.database import init_db, async_session
from app.models.user import User
from app.services.auth_service import hash_password, verify_password
from sqlalchemy import select

async def main():
    print(f"App Tag: {settings.APP_TAG}")
    print(f"Google Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
    print(f"Stripe Key set: {bool(settings.STRIPE_SECRET_KEY)}")
    
    # Initialize DB schema
    await init_db()
    print("Database tables initialized successfully.")
    
    # Test creating / querying a supporter
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == "supporter.test@teachmehealth.org"))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email="supporter.test@teachmehealth.org",
                hashed_password=hash_password("BackupPass123!"),
                full_name="Dr. Supporter Test",
                role="supporter",
                phone_number="+61 400 999 888",
                address="123 Health Ave, Melbourne VIC",
                supporter_comments="Excited about AI health LMS",
                app_tag=settings.APP_TAG,
                firebase_uid="firebase_test_uid_123",
                is_verified=True,
            )
            session.add(user)
            await session.commit()
            print("Created test supporter record.")
        else:
            print(f"Found existing supporter: {user.full_name}, role: {user.role}, tag: {user.app_tag}")
            
        # Verify secondary password verification
        assert verify_password("BackupPass123!", user.hashed_password)
        print("Secondary login password verified successfully!")
        print(f"User details: Phone={user.phone_number}, Address={user.address}, Tag={user.app_tag}")

if __name__ == "__main__":
    asyncio.run(main())
