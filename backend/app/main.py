
from datetime import datetime
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from backend.app.database import Base, SessionLocal, engine
from backend.app.models import Incident

Base.metadata.create_all(bind=engine)

# Add columns to an existing prototype database when needed.
# This preserves incidents already saved in SQLite.
with engine.begin() as connection:
    columns = {
        column["name"]
        for column in inspect(connection).get_columns("incidents")
    }

    migrations = {
        "severity": (
            "ALTER TABLE incidents ADD COLUMN "
            "severity VARCHAR(20) NOT NULL DEFAULT 'medium'"
        ),
        "verification_status": (
            "ALTER TABLE incidents ADD COLUMN "
            "verification_status VARCHAR(30) "
            "NOT NULL DEFAULT 'pending'"
        ),
        "created_at": (
            "ALTER TABLE incidents ADD COLUMN created_at DATETIME"
        ),
        "updated_at": (
            "ALTER TABLE incidents ADD COLUMN updated_at DATETIME"
        ),
    }

    for column_name, statement in migrations.items():
        if column_name not in columns:
            connection.execute(text(statement))


app = FastAPI(
    title="AIDIRP API",
    description="AI-Powered Disaster Intelligence and Response Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    hazard_type: str = Field(min_length=3, max_length=40)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: str = Field(default="", max_length=2000)
    severity: Literal["low", "medium", "high", "critical"] = "medium"


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    severity: Literal["low", "medium", "high", "critical"] | None = None
    status: Literal["Reported", "Investigating", "Resolved"] | None = None
    verification_status: Literal["pending", "verified", "rejected"] | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    hazard_type: str
    latitude: float
    longitude: float
    description: str
    severity: str
    status: str
    verification_status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "aidirp-api"}


@app.post("/incidents", response_model=IncidentResponse, status_code=201)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
):
    incident = Incident(**payload.model_dump())

    db.add(incident)
    db.commit()
    db.refresh(incident)

    return incident


@app.get("/incidents")
def list_incidents(
    hazard_type: str | None = None,
    status: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Incident)

    if hazard_type:
        query = query.filter(Incident.hazard_type == hazard_type)

    if status:
        query = query.filter(Incident.status == status)

    total = query.count()

    incidents = (
        query.order_by(Incident.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "incidents": [
            IncidentResponse.model_validate(item).model_dump()
            for item in incidents
        ],
    }


@app.get("/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = db.get(Incident, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return incident


@app.patch("/incidents/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
):
    incident = db.get(Incident, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(incident, field, value)

    incident.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)

    return incident


@app.delete("/incidents/{incident_id}")
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = db.get(Incident, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    db.delete(incident)
    db.commit()

    return {
        "message": "Incident deleted successfully",
        "id": incident_id,
    }


@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()

    return {
        "total_incidents": len(incidents),
        "by_hazard": {
            hazard: sum(
                item.hazard_type.lower() == hazard
                for item in incidents
            )
            for hazard in sorted({
                item.hazard_type.lower()
                for item in incidents
            })
        },
        "by_severity": {
            severity: sum(
                item.severity == severity
                for item in incidents
            )
            for severity in ["low", "medium", "high", "critical"]
        },
        "by_status": {
            status: sum(
                item.status == status
                for item in incidents
            )
            for status in ["Reported", "Investigating", "Resolved"]
        },
        "pending_verification": sum(
            item.verification_status == "pending"
            for item in incidents
        ),
    }
