# Based on https://github.com/linuxserver/docker-baseimage-alpine-nginx/blob/master/Dockerfile
# except without:
# * PHP
# * git
# * apache2-utils
# * SSL support (will be run behind a reverse proxy that will handle SSL)
#
# Needs the files in ./root from https://github.com/linuxserver/docker-baseimage-alpine-nginx/tree/master/root
# but remove the following folders and files:
# * ./root/etc/services.d/php-fpm/
# * ./root/etc/logrotate.d/php-fpm7
# * ./root/etc/cont-init.d/30-keygen
# And comment all mentions to PHP in ./root/etc/cont-init.d/20-config

FROM ghcr.io/linuxserver/baseimage-alpine:3.13

# install packages
RUN \
 echo "**** install build packages ****" && \
 apk add --no-cache \
#	apache2-utils \
#	git \
#	libressl3.1-libssl \
	logrotate \
	nano \
	nginx \
#	openssl \
#	php7 \
#	php7-fileinfo \
#	php7-fpm \
#	php7-json \
#	php7-mbstring \
#	php7-openssl \
#	php7-session \
#	php7-simplexml \
#	php7-xml \
#	php7-xmlwriter \
#	php7-zlib && \
 && \
 echo "**** configure nginx ****" && \
 echo 'fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;' >> \
	/etc/nginx/fastcgi_params && \
 rm -f /etc/nginx/conf.d/default.conf && \
 echo "**** fix logrotate ****" && \
 sed -i "s#/var/log/messages {}.*# #g" /etc/logrotate.conf && \
 sed -i 's#/usr/sbin/logrotate /etc/logrotate.conf#/usr/sbin/logrotate /etc/logrotate.conf -s /config/log/logrotate.status#g' \
	/etc/periodic/daily/logrotate

# add local files
COPY root/ /

# ports and volumes
#EXPOSE 80 443
EXPOSE 80
VOLUME /config


# End of docker-baseimage-alpine-nginx


# Include the production website files
COPY ./src /config/www

# The nginx config file
COPY ./nginx-config/nginx-config /config/nginx/site-confs/default
