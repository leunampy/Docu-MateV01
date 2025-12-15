FROM ollama/ollama:latest

# Installa nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Configura nginx con CORS
RUN echo 'server { \n\
    listen 11434; \n\
    location / { \n\
        if ($request_method = OPTIONS) { \n\
            add_header Access-Control-Allow-Origin *; \n\
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS"; \n\
            add_header Access-Control-Allow-Headers "Content-Type"; \n\
            return 204; \n\
        } \n\
        add_header Access-Control-Allow-Origin *; \n\
        proxy_pass http://127.0.0.1:11435; \n\
        proxy_set_header Host $host; \n\
    } \n\
}' > /etc/nginx/sites-enabled/default

# Script di avvio che parte come processo principale
CMD nginx && \
    OLLAMA_HOST=127.0.0.1:11435 ollama serve & \
    sleep 10 && \
    ollama pull llama3.2:latest && \
    tail -f /var/log/nginx/access.log
