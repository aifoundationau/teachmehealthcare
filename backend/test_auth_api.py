import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_full_auth_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root check
        resp = await client.get("/")
        print("Root endpoint status:", resp.status_code, resp.json())
        assert resp.status_code == 200

        # 2. Supporter Registration with Google OAuth & Backup Password & Personal Details
        reg_payload = {
            "email": "supporter.sarah@teachmehealth.org",
            "password": "SarahBackupPassword2026!",
            "full_name": "Sarah Jenkins",
            "phone_number": "+61 412 345 678",
            "address": "42 Collins St, Melbourne VIC 3000",
            "comments": "Specializing in orthopedic nursing and LMS learning resources",
            "firebase_uid": "fb_google_uid_998877",
            "role": "supporter",
            "app_tag": "healthlms"
        }
        resp = await client.post("/api/auth/supporter-register", json=reg_payload)
        print("Supporter registration status:", resp.status_code)
        assert resp.status_code == 200, f"Registration failed: {resp.text}"
        data = resp.json()
        token = data["access_token"]
        user = data["user"]
        print("Supporter registered:")
        print(f" - Name: {user['full_name']}")
        print(f" - Email: {user['email']}")
        print(f" - Role: {user['role']}")
        print(f" - App Tag: {user['app_tag']}")
        print(f" - Phone: {user['phone_number']}")
        print(f" - Address: {user['address']}")
        print(f" - Comments: {user['supporter_comments']}")
        assert user["role"] == "supporter"
        assert user["app_tag"] == "healthlms"

        # 3. Secondary Login Password Backup test: Login with Email & Secondary Password
        login_payload = {
            "email": "supporter.sarah@teachmehealth.org",
            "password": "SarahBackupPassword2026!"
        }
        resp = await client.post("/api/auth/login", json=login_payload)
        print("Secondary login password backup status:", resp.status_code)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        login_data = resp.json()
        print("Successfully logged in with secondary password backup! Token received.")

        # 4. Get Current Profile
        headers = {"Authorization": f"Bearer {login_data['access_token']}"}
        resp = await client.get("/api/auth/me", headers=headers)
        print("Get profile (/me) status:", resp.status_code)
        assert resp.status_code == 200
        me_user = resp.json()
        assert me_user["role"] == "supporter"
        assert me_user["app_tag"] == "healthlms"

        # 5. Supporter Stripe config check
        resp = await client.get("/api/supporter/config")
        print("Supporter Stripe config status:", resp.status_code, resp.json())
        assert resp.status_code == 200

        print("\nALL BACKEND AUTH & SUPPORTER TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_full_auth_flow())
