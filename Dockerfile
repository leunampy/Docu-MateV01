FROM ollama/ollama:latest

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

RUN echo 'server { \n\
    listen 11434; \n\
    location / { \n\
        add_header Access-Control-Allow-Origin * always; \n\
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always; \n\
        add_header Access-Control-Allow-Headers "Content-Type" always; \n\
        if ($request_method = OPTIONS) { return 204; } \n\
        proxy_pass http://127.0.0.1:11435; \n\
    } \n\
}' > /etc/nginx/sites-enabled/default

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
