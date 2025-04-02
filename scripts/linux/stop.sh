#!/bin/bash
echo "Stopping local services..."

# Kill any processes running on key ports
PORTS=(8000 8080 8793)

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti tcp:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)..."
    kill -9 $PID
  else
    echo "No process running on port $PORT."
  fi
done

echo "All services stopped."
