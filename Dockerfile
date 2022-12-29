FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy over project source
COPY . .

# Install yarn and sass
RUN npm install --global sass

# Install package dependencies
RUN yarn install --production=true

# Set environment variables
ENV HTTP_PORT=3000
ENV HTTP_HOST=0.0.0.0

# Expose the http port
EXPOSE ${HTTP_PORT}

RUN rm -rf ./.next
RUN yarn build
RUN sass --style=compressed ./styles/style.scss ./styles/style.css

CMD [ "yarn", "start" ]