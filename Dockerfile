FROM ollama/ollama:latest

# Installa nginx per gestire CORS
RUN apt-get update && apt-get install -y nginx

# Configurazione nginx con CORS
RUN echo 'server { \n\
    listen 11434; \n\
    location / { \n\
        add_header Access-Control-Allow-Origin *; \n\
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS"; \n\
        add_header Access-Control-Allow-Headers "Content-Type, Authorization"; \n\
        if ($request_method = OPTIONS) { \n\
            return 204; \n\
        } \n\
        proxy_pass http://localhost:11435; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Script di avvio
RUN echo '#!/bin/bash\n\
nginx\n\
ollama serve &\n\
sleep 10\n\
ollama pull llama3.2:latest\n\
tail -f /dev/null' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
