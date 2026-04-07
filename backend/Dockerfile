# Build Stage
FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm install

COPY . .

# Build the project to generate dist/
RUN npm run build

# Production Stage
FROM node:22-slim

WORKDIR /usr/src/app

# Only copy production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port (Cloud Run sets PORT env automatically, but this is good practice)
EXPOSE 8080

# Run the compiled code
CMD [ "node", "dist/server.js" ]
