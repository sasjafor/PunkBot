FROM node:17-alpine AS BUILD_IMAGE

WORKDIR /usr/src/app

# Install dependencies
RUN apk add --update --no-cache alpine-sdk \
                                autoconf \
                                automake \
                                libtool \
                                make \
                                musl \
                                python3 && \
    ln -sf python3 /usr/bin/python

# Copy package info
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/

# Install node dependencies
RUN npm pkg set scripts.prepare=" " && \
    npm ci --omit=dev

FROM node:17-alpine

WORKDIR /usr/src/app

# Set locale
ENV LC_ALL C.UTF-8

# Create /config
RUN mkdir /config

# Install dependencies
RUN apk add --update --no-cache ffmpeg \
    python3 && \
    ln -sf python3 /usr/bin/python

# Copy package.json
COPY package.json .

# Copy dependencies from build image
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

# Copy lib folder
COPY src/lib ./lib

# Copy commands folder
COPY src/commands ./commands

# Copy bot script file
COPY src/bot.js .

# Copy run script
COPY src/run.sh ..

EXPOSE 8080
VOLUME /config
CMD ["/usr/src/run.sh"]
