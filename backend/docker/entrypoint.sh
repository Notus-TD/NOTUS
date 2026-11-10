#!/bin/bash
# Sobe no mesmo container: Loki (logs), Caddy (proxy na porta pública) e o Spring Boot.
# Loki e Caddy rodam em segundo plano e são reiniciados em 5 s se caírem; o Java é o processo principal.
#
#   porta pública ($PORT, padrão 8080) -> Caddy
#       /loki/api/v1/*  -> Loki 127.0.0.1:3100 (com usuário e senha, para o Grafana Cloud)
#       resto           -> Spring 127.0.0.1:8081

PORTA_PUBLICA="${PORT:-8080}"
PORTA_SPRING=8081

# Sem LOKI_PASSWORD, o acesso externo ao Loki fica trancado com uma senha aleatória que ninguém conhece.
export LOKI_USER="${LOKI_USER:-grafana}"
if [ -z "${LOKI_PASSWORD:-}" ]; then
  echo "AVISO: LOKI_PASSWORD não definida; o Loki não poderá ser lido de fora (Grafana Cloud)." >&2
  LOKI_PASSWORD="$(head -c 32 /dev/urandom | base64)"
fi
LOKI_PASSWORD_HASH="$(caddy hash-password --plaintext "$LOKI_PASSWORD")"
export LOKI_PASSWORD_HASH
unset LOKI_PASSWORD

(
  while true; do
    # Só 127.0.0.1: de fora, o Loki só é alcançado pelo Caddy (com senha).
    loki -config.file=/etc/loki/loki-config.yaml -log.level=warn \
      -server.http-listen-address=127.0.0.1 -server.grpc-listen-address=127.0.0.1 \
      -common.storage.ring.instance-addr=127.0.0.1 -frontend.instance-addr=127.0.0.1 \
      -query-scheduler.ring.instance-addr=127.0.0.1 -compactor.ring.instance-addr=127.0.0.1
    echo "AVISO: o Loki parou (código $?); reiniciando em 5 s." >&2
    sleep 5
  done
) &

(
  while true; do
    PORT="$PORTA_PUBLICA" caddy run --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1 \
      | grep -v '"level":"info"'
    echo "AVISO: o Caddy parou; reiniciando em 5 s." >&2
    sleep 5
  done
) &

# Espera o Loki ficar pronto (até 30 s) para não perder os logs da inicialização do Spring.
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:3100/ready > /dev/null 2>&1; then
    echo "Loki pronto"
    break
  fi
  sleep 1
done || true
curl -fsS http://localhost:3100/ready > /dev/null 2>&1 \
  || echo "AVISO: o Loki ainda não está pronto; a aplicação vai iniciar mesmo assim." >&2

# exec: o Java substitui este script e recebe do tini os sinais de parada do container.
# Spring só em 127.0.0.1: o tráfego externo sempre passa pelo Caddy.
export PORT="$PORTA_SPRING" SERVER_ADDRESS=127.0.0.1
unset LOKI_PASSWORD_HASH
exec java $JAVA_OPTS -jar /app/app.jar
