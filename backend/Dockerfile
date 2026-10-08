FROM php:8.4-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libpq-dev libsqlite3-dev libonig-dev libicu-dev libzip-dev \
    && docker-php-ext-install pdo_pgsql pdo_sqlite mbstring intl zip bcmath opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache \
    && sed -i 's/\r$//' deploy/start.sh
COPY deploy/apache.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 10000
CMD ["sh", "deploy/start.sh"]
