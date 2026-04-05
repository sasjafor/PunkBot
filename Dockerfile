FROM node:25.9.0-alpine3.23 AS BUILD_IMAGE

WORKDIR /app

# Install dependencies
RUN apk add --update --no-cache alpine-sdk \
                                autoconf \
                                automake \
                                bash \
                                libtool \
                                make \
                                musl \
                                python3 && \
    ln -sf python3 /usr/bin/python

# Copy package info
COPY package.json .
COPY package-lock.json .

# Install dependencies for production
RUN npm pkg set scripts.prepare=" " && \
    npm ci --omit-dev

RUN cp -r node_modules node_modules_prod

COPY tsconfig.json .
COPY src ./src

# Install node dependencies
RUN npm pkg set scripts.prepare=" " && \
    npm ci

RUN npm run build

FROM node:25.9.0-alpine3.23

WORKDIR /app

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
COPY --from=BUILD_IMAGE /app/node_modules_prod ./node_modules

# Copy built app from build image
COPY --from=BUILD_IMAGE /app/build ./build

# Copy run script
COPY src/run.sh .

# Install yt-dlp
ADD https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp /usr/local/bin/
RUN chmod a+rx /usr/local/bin/yt-dlp

EXPOSE 8080
VOLUME /config
CMD ["/app/run.sh"]
