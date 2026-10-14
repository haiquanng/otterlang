from fastapi.testclient import TestClient

PASSWORD = "river-stones-42"


def signup(client: TestClient, email: str = "otter@example.com") -> dict[str, str]:
    """Create a user and return headers authenticating as them."""
    response = client.post("/auth/signup", json={"email": email, "password": PASSWORD})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
