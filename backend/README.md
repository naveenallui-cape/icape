# i-CAPE Backend

Node.js + Express + TypeScript API for the i-CAPE Olympiad Management Platform.

## Setup

```bash
npm install
cp .env.example .env
```

Ensure PostgreSQL is running (see root `docker-compose.yml`).

## Development

```bash
npm run dev
```

API: `http://localhost:5000/api`

Health: `GET /api/health`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
