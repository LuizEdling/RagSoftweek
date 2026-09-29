#!/usr/bin/env bash
# Aquece a instância do backend antes do workshop (útil em planos free,
# que "dormem" após um período sem uso e demoram na primeira requisição).
#
# Uso: ./scripts/warmup.sh https://seu-backend.onrender.com
set -euo pipefail

URL="${1:?Uso: ./scripts/warmup.sh <url-do-backend>}"

echo "Aquecendo $URL ..."
for i in 1 2 3; do
  curl -s -o /dev/null -w "tentativa $i -> status %{http_code}, %{time_total}s\n" "$URL/api/health"
  sleep 2
done
echo "Pronto."
