# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + SUMO + serve frontend
FROM python:3.11-slim

# Install SUMO
RUN apt-get update && \
    apt-get install -y --no-install-recommends sumo sumo-tools && \
    rm -rf /var/lib/apt/lists/*

ENV SUMO_HOME=/usr/share/sumo

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy SUMO config files
COPY genvanet.* ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
