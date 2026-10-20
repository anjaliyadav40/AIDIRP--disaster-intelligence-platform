
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "aidirp-api",
    }


def test_create_valid_incident():
    payload = {
        "title": "River water level report",
        "hazard_type": "flood",
        "latitude": 28.6139,
        "longitude": 77.209,
        "description": "Test incident for AIDIRP",
    }

    response = client.post("/incidents", json=payload)

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["title"] == "River water level report"
    assert data["hazard_type"] == "flood"
    assert data["severity"] == "medium"
    assert data["status"] == "Reported"
    assert data["verification_status"] == "pending"


def test_reject_invalid_latitude():
    payload = {
        "title": "River water level report",
        "hazard_type": "flood",
        "latitude": 120,
        "longitude": 77.209,
        "description": "Invalid latitude test",
    }

    response = client.post("/incidents", json=payload)

    assert response.status_code == 422


def test_reject_missing_title():
    payload = {
        "hazard_type": "flood",
        "latitude": 28.6139,
        "longitude": 77.209,
        "description": "Missing title test",
    }

    response = client.post("/incidents", json=payload)

    assert response.status_code == 422
