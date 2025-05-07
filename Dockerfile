# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.17.0

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

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage bind mounts to package.json and yarn.lock to avoid having to copy them
# into this layer.
RUN corepack enable
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=.yarnrc.yml,target=.yarnrc.yml \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=cache,id=yarn,target=/root/.yarn \
    yarn install --immutable

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN yarn build

################################################################################
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /usr/src/app

# copy the self-contained build artefacts
COPY --from=build /usr/src/app/.output ./.output

ENV NODE_ENV=production
EXPOSE 3000

# Nitro’s entry point
CMD ["node", ".output/server/index.mjs"]
