FROM nginx:alpine

# Copy Nginx configuration template for environment variable substitution
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy static assets to Nginx public directory
COPY index.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

# Set default PORT environment variable (will be overridden by Cloud Run)
ENV PORT=8080

EXPOSE 8080
