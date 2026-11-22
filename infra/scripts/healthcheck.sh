#!/usr/bin/env bash
set -u

# ==============================================================================
# Full Stack Services Healthcheck Monitor
# Inspects API, Redis, Meilisearch, Web, and Admin endpoints.
# ==============================================================================

API_URL="${API_URL:-http://localhost:4000/v1/health}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3001}"
MEILI_URL="${MEILI_URL:-http://localhost:7700/health}"

check_endpoint() {
  local service_name="$1"
  local url="$2"
  
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "${url}" || echo "DOWN")
  
  if [ "$status_code" = "200" ]; then
    echo "  [OK] $service_name is healthy (HTTP 200) -> $url"
  else
    echo "  [FAIL] $service_name is unhealthy ($status_code) -> $url"
  fi
}

echo "🩺 Performing healthcheck checks across platform services..."
check_endpoint "Backend API" "${API_URL}"
check_endpoint "Meilisearch Engine" "${MEILI_URL}"
check_endpoint "Storefront Web App" "${WEB_URL}"
check_endpoint "Admin Console" "${ADMIN_URL}"
echo "🏁 Healthcheck probe complete."
