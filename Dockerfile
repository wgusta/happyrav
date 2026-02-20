FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libfreetype6 \
    libjpeg62-turbo \
    libpng16-16 \
    libffi8 \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY happyrav/requirements.txt /app/happyrav/requirements.txt
RUN pip install --no-cache-dir -r /app/happyrav/requirements.txt

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "happyrav.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
