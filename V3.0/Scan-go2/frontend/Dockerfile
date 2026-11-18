# Frontend estático Scan & Go 2 - Nginx fijo y ligero.
FROM nginx:1.27.5-alpine3.21

# Contenido estático necesario en producción (copias explícitas: nada de COPY .).
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY tobi-allergens.js tobi-chat.js tobi-discounts.js tobi-history.js tobi-profile.js tobi-recipes.js /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/

# Configuración del servidor con encabezados de seguridad.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
