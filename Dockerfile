# =============================================================================
# STAGE 1: deps
# Install only production dependencies. We do this in its own stage so the
# install layer is cached separately from the build — if only source files
# change, Docker reuses this layer and skips re-running npm install.
# =============================================================================
FROM node:20-alpine AS deps

# Set the working directory inside the container. All subsequent commands
# run relative to this path.
WORKDIR /app

# Copy package files first (before source code). Because Docker caches each
# layer, copying package.json separately means the npm install layer is only
# invalidated when dependencies actually change, not on every code change.
COPY package.json package-lock.json ./

# Install dependencies. --omit=dev skips devDependencies since we only need
# them to build, not to run. ci is stricter than install — it uses the
# lockfile exactly, which is what you want in a repeatable build.
RUN npm ci --omit=dev


# =============================================================================
# STAGE 2: builder
# Build the Next.js app. This stage needs devDependencies (TypeScript, etc.)
# so we do a full install here, separate from the lean production deps above.
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies)
# needed to compile TypeScript and build the Next.js app.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code. This layer is invalidated on any source
# change, but the npm install layer above is still reused.
COPY . .

# Environment variables that must be available at BUILD time (Next.js bakes
# NEXT_PUBLIC_* vars into the client bundle during the build step).
# These are build args — passed in at build time, not stored in the image.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the Next.js app. Because next.config.mjs has output: 'standalone',
# this produces .next/standalone — a minimal folder that can run without
# the full node_modules tree.
RUN npm run build


# =============================================================================
# STAGE 3: runner (production image)
# This is the final image that actually gets deployed. It starts fresh from
# the base Node image and only copies in what's needed to run the app —
# no source code, no devDependencies, no build tools.
# =============================================================================
FROM node:20-alpine AS runner

# Links this image to the GitHub repository so it appears on the repo's
# Packages section on GitHub.
LABEL org.opencontainers.image.source="https://github.com/davida227/wardrobe-app"

WORKDIR /app

# Run as a non-root user. By default containers run as root, which is a
# security risk — if the container is compromised, the attacker has root
# inside it. This adds and switches to an unprivileged user.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy the standalone build output from the builder stage.
# The standalone folder includes a minimal node_modules with only what's
# needed at runtime — no full reinstall required.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (images, fonts, etc.) into the expected location.
# Next.js serves these from .next/static at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Tell Docker this container listens on port 3000. This is documentation —
# it doesn't actually publish the port (that happens at `docker run` time).
EXPOSE 3000

# ANTHROPIC_API_KEY is a server-side secret. Unlike NEXT_PUBLIC_* vars it is
# NOT baked into the build — it's injected at runtime via `docker run -e` or
# Docker Compose. This ENV line just sets a placeholder default.
ENV ANTHROPIC_API_KEY=""
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The command that runs when the container starts.
# node server.js is the entrypoint produced by Next.js standalone output.
CMD ["node", "server.js"]
