FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/culqi/package.json packages/culqi/
RUN npm ci

COPY . .

# NEXT_PUBLIC_* se inyecta en el bundle del cliente durante el build.
ARG NEXT_PUBLIC_CULQI_PUBLIC_KEY
ENV NEXT_PUBLIC_CULQI_PUBLIC_KEY=$NEXT_PUBLIC_CULQI_PUBLIC_KEY

RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
