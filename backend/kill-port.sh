#!/bin/bash
# Script to kill processes using port 3001

PORT=3001
PIDS=$(lsof -ti:$PORT)

if [ -z "$PIDS" ]; then
  echo "No processes found using port $PORT"
else
  echo "Killing processes using port $PORT: $PIDS"
  kill -9 $PIDS
  echo "Port $PORT is now free"
fi


