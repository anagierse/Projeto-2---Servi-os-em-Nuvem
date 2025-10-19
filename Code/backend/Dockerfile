FROM python:3.10-slim

ENV DB_HOST=  \
    DB_NAME=  \
    DB_USER=  \
    DB_PASSWORD=  \
    DB_PORT=5432

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 3000

CMD ["gunicorn", "--bind", "0.0.0.0:3000", "src.app:app"]