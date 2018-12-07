FROM node:10

# Copy run script
COPY src/run.sh /usr/src/

# Copy package.json
COPY package.json /usr/src/app/

# Setup apt, install non-node dependencies and create /config
RUN mkdir /config

# Install node dependencies
RUN cd /usr/src/app && \
    npm install --save-prod

# Copy lib folder
COPY src/lib /usr/src/app/lib

# Copy bot script file
COPY src/bot.js /usr/src/app/

EXPOSE 8080
VOLUME /config
CMD ["/usr/src/run.sh"]
