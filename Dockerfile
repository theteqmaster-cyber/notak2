FROM php:8.2-fpm-alpine

# Install system deps
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libzip-dev \
    libxml2-dev \
    oniguruma-dev \
    postgresql-dev \
    zip unzip git

# Install PHP extensions
RUN docker-php-ext-install \
    pdo pdo_pgsql pgsql \
    mbstring \
    xml dom \
    zip \
    gd \
    bcmath \
    pcntl

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application
COPY . .

# Install PHP dependencies (production)
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Supervisord config
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 8080

# Make startup script executable
RUN chmod +x docker/start.sh

CMD ["/bin/sh", "docker/start.sh"]
