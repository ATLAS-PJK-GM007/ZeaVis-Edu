FROM python:3.11-slim AS runner

WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=/app/model/best_model.keras
ENV MODEL_INPUT_SIZE=224

RUN apt-get update \
  && apt-get install -y --no-install-recommends libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY apps/ml-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/ml-service ./
COPY Machine_Learning/best_model/best_model.keras /app/model/best_model.keras

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
