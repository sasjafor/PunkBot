FROM node:17 AS BUILD_IMAGE

WORKDIR /usr/src/app

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 \
                                               python-is-python3

# Copy package.json
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/

# Install node dependencies
RUN npm set-script prepare "" && \
    npm ci --omit=dev

FROM node:17

WORKDIR /usr/src/app

# Set locale
ENV LC_ALL C.UTF-8

# Create /config
RUN mkdir /config

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg \
                                               python3 \
                                               python-is-python3

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
