FROM node:15

# Generate locale
#RUN apt-get update && \
#    apt-get install -y --no-install-recommends locales && \
#    locale-gen en_GB.UTF8

# Set locale
ENV LC_ALL C.UTF-8

# Copy run script
COPY src/run.sh /usr/src/

# Copy package.json
COPY package.json /usr/src/app/

# Setup apt, install non-node dependencies and create /config
RUN mkdir /config

# Install node dependencies
RUN cd /usr/src/app && \
    npm install --save-prod

# Set debug env
ENV DEBUG basic,verbose

# Copy lib folder
COPY src/lib /usr/src/app/lib

# Copy commands folder
COPY src/commands /usr/src/app/commands

# Copy bot script file
COPY src/bot.js /usr/src/app/

# Install youtube-dl
ADD https://yt-dl.org/downloads/latest/youtube-dl /usr/local/bin/
RUN chmod a+rx /usr/local/bin/youtube-dl

EXPOSE 8080
VOLUME /config
CMD ["/usr/src/run.sh"]
