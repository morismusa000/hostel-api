FROM php:8.2-apache

# Enable mod_rewrite
RUN a2enmod rewrite

# Install mysqli extension
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Copy all files to Apache's document root
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Use port 10000 for Render
EXPOSE 10000

# Start Apache
CMD ["apache2-foreground"]
