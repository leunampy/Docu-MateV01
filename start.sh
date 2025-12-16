#!/bin/bash
nginx
OLLAMA_HOST=127.0.0.1:11435 ollama serve &
sleep 15
ollama pull llama3.2:latest
tail -f /var/log/nginx/access.log

