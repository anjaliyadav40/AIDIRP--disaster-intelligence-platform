
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)

from backend.app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    hazard_type = Column(String(40), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, default="")

    severity = Column(String(20), default="medium", nullable=False)
    status = Column(String(30), default="Reported", nullable=False)
    verification_status = Column(
        String(30), default="pending", nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
