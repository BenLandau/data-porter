FROM ubuntu:16.04
RUN apt-get update && apt-get install -y build-essential tar git curl wget dialog net-tools
RUN mkdir -p /var/log/supervisor && mkdir -p /data && mkdir -p /logs

# Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

# Add in the code
ADD /app /app
ADD /init /init

# Install required packages
RUN cd app && npm install && cd ..

# Generate the template
RUN cd /app && node build_index.js && cd ..

EXPOSE 3000

WORKDIR /init
CMD ["/bin/bash", "-c", "./load-env.sh && . /etc/profile && ./start.sh"]
