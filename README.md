# booqit-sso
==========

## Development server:

### Production-like, with the actual Nginx server configuration:

* Build the Docker image (first two steps listed below)
* Run ``docker run -it --rm -p 8080:80 -e PUID=1000 -e PGID=1000 --name booqit-sso -v `pwd`/src/:/config/www/ e2jk/booqit-sso`` in the root folder and access from your browser at http://localhost:8080/
* Alternatively you can also build and run the development configuration with docker-compose: ``docker-compose -f docker-compose.yml -f "docker-compose.debug.yml" up -d --build``

### Quick and dirty:

Run `$ python3 -m http.server 8000 --bind 127.0.0.1` in the `./src` folder

## Create the Docker image and publish it to Docker Hub

Run:

* `docker build -t e2jk/booqit-sso:latest --rm .` to build the Docker image.
* ``docker run -it --rm -p 8080:80 -e PUID=1000 -e PGID=1000 --name booqit-sso e2jk/booqit-sso`` to test the Docker image locally at address http://localhost:8080/
* `docker push e2jk/booqit-sso:latest` to push the Docker image to Docker Hub.
