#!/bin/bash
set -e

echo "Starting nginx..."
nginx

echo "Starting Ollama server on 127.0.0.1:11435..."
OLLAMA_HOST=127.0.0.1:11435 ollama serve > /tmp/ollama.log 2>&1 &
OLLAMA_PID=$!

echo "Waiting for Ollama to be ready..."
sleep 5

echo "Pulling llama3.2 model..."
OLLAMA_HOST=127.0.0.1:11435 ollama pull llama3.2:latest

echo "Setup complete. Tailing nginx logs..."
tail -f /var/log/nginx/access.log /tmp/ollama.log
