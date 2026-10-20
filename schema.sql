
CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(120) NOT NULL,
    hazard_type VARCHAR(40) NOT NULL,
    latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    description TEXT DEFAULT '',
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'Reported',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_hazard
ON incidents(hazard_type);

CREATE INDEX IF NOT EXISTS idx_incidents_status
ON incidents(status);

CREATE INDEX IF NOT EXISTS idx_incidents_created
ON incidents(created_at);
