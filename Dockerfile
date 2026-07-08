# We use the "alpine" variant of the Node image because it's much smaller
# (faster to build, faster to pull, less attack surface) than the default.
FROM node:20-alpine

# All commands below run relative to this directory INSIDE the container.
WORKDIR /app

# We copy package.json (and package-lock.json if present) FIRST, before the
# rest of the source code. This is a Docker caching trick: as long as your
# dependencies don't change, Docker reuses the cached "npm install" layer
# instead of re-running it every time you change a source file, which
# makes rebuilds much faster during development.
COPY package*.json ./
RUN npm install --omit=dev

# Now copy the rest of the actual source code.
COPY . .

# We're not compiling anything (plain JS), so no build step is needed here
# — unlike the TypeScript version, which needed "RUN npm run build".

# Document which port this container listens on (informational only —
# doesn't actually publish the port by itself).
EXPOSE 8080

# The command that runs when the container starts.
CMD ["node", "src/index.js"]
