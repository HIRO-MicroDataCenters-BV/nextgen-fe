# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=22.12.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for building the application.
FROM base AS build

ARG NUXT_PUBLIC_APP_VERSION=1.0.0
ENV NUXT_PUBLIC_APP_VERSION=$NUXT_PUBLIC_APP_VERSION

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Download dependencies as a separate step to take advantage of Docker's caching.
# Bind-mount lockfiles so the layer invalidates when deps change; cache pnpm store.
# Install pnpm via npm (not corepack): corepack in some Node images fails signature
# verification when resolving pnpm ("Cannot find matching keyid"). Match package.json "packageManager".
RUN npm install -g --no-audit --no-fund pnpm@9.15.9
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=.npmrc,target=.npmrc \
    --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy the rest of the source files into the image.
COPY . .

# Run the build script.
RUN pnpm run build

################################################################################
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /usr/src/app

# copy the self-contained build artefacts
COPY --from=build /usr/src/app/.output ./.output

ENV NODE_ENV=production
EXPOSE 3000

# Nitro’s entry point
CMD ["node", ".output/server/index.mjs"]
