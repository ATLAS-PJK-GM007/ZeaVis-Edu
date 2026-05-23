FROM rust:1.95-trixie AS builder

WORKDIR /app
COPY apps/ml-service/Cargo.toml apps/ml-service/Cargo.lock ./
COPY apps/ml-service/src ./src
RUN cargo build --locked --release

FROM debian:trixie-slim AS runner

WORKDIR /app
ENV MODEL_PATH=/app/model/model.onnx
ENV MODEL_INPUT_SIZE=224
ENV ML_SERVICE_HOST=0.0.0.0
ENV ML_SERVICE_PORT=8000
ENV RUST_LOG=info

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/zeavis-ml-service /usr/local/bin/zeavis-ml-service
COPY Machine_Learning/model/model.onnx /app/model/model.onnx

EXPOSE 8000
CMD ["zeavis-ml-service"]
