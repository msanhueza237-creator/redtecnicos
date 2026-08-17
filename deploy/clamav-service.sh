#!/usr/bin/env sh
set -eu

SERVICE_NAME="${CLAMAV_SERVICE_NAME:-redtecnicos-clamav}"
IMAGE="${CLAMAV_IMAGE:-clamav/clamav:1.5.3}"
NETWORK="${CLAMAV_NETWORK:-dokploy-network}"
VOLUME="${CLAMAV_VOLUME:-redtecnicos-clamav-db}"

docker network inspect "$NETWORK" >/dev/null
docker volume create "$VOLUME" >/dev/null
docker pull "$IMAGE" >/dev/null

if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  docker service update \
    --image "$IMAGE" \
    --force \
    --limit-memory 3G \
    --reserve-memory 1G \
    "$SERVICE_NAME" >/dev/null
else
  docker service create \
    --name "$SERVICE_NAME" \
    --network "$NETWORK" \
    --mount "type=volume,source=$VOLUME,target=/var/lib/clamav" \
    --constraint "node.role==manager" \
    --limit-memory 3G \
    --reserve-memory 1G \
    --restart-condition any \
    --restart-delay 10s \
    "$IMAGE" >/dev/null
fi

attempt=0
while [ "$attempt" -lt 60 ]; do
  replicas="$(docker service ls --filter "name=$SERVICE_NAME" --format '{{.Replicas}}')"
  if [ "$replicas" = "1/1" ]; then
    echo "$SERVICE_NAME listo en la red privada $NETWORK"
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 5
done

echo "ClamAV no alcanzó el estado 1/1 dentro del plazo." >&2
docker service ps "$SERVICE_NAME" --no-trunc >&2
exit 1
