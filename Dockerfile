FROM node:22-alpine AS BUILD_IMAGE

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

FROM node:22-alpine

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

EXPOSE 8080
VOLUME /config
CMD ["/app/run.sh"]
