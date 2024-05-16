FROM python:3.10

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y default-mysql-client

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    python3-dev \
    libffi-dev \
    libssl-dev \
    cargo \
    libgl1-mesa-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend /app/

# Copy the entrypoint script into the image
COPY ./backend/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Set the script to be executed
ENTRYPOINT ["/entrypoint.sh"]

CMD ["uvicorn", "backend.asgi:application", "--host", "0.0.0.0", "--reload"]
