FROM mhart/alpine-node:12.16.1

ENV APP_DIR /app/online-tp

# Cache a layer or two, optimize later
ADD package.json /tmp/package.json
# Install dependencies
RUN cd /tmp && npm install
RUN mkdir -p $APP_DIR && cp -a /tmp/node_modules $APP_DIR

# Add app source
WORKDIR $APP_DIR
ADD . $APP_DIR

EXPOSE 7070 
EXPOSE 8080

# run application
CMD [ "sh", "-c", "node online-tp.js" ]