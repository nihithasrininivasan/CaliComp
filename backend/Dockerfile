FROM python:3.11-slim

WORKDIR /app

# Install SDK first (it has no web deps)
COPY sdk/ /app/sdk/
RUN pip install --no-cache-dir -e /app/sdk

# Install backend dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/app/ /app/app/

# Copy data directory for sample files
COPY data/ /app/data/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
