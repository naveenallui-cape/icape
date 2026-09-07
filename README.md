# i-CAPE Olympiad Management Platform

Enterprise olympiad management platform for school and student registration, results, and administration.

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Object Storage | Cloudinary |

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| API | http://localhost:5000/api |

## Project Structure

```text
i-cape/
├── frontend/          # Next.js application
├── backend/           # Express + TypeScript API
├── docker-compose.yml # PostgreSQL for local development
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20+
- npm
- Docker (for PostgreSQL)

## Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

Backend runs at http://localhost:5000  
Health check: http://localhost:5000/api/health

> **macOS note:** System AirPlay Receiver often binds to port `5000`. If the API fails to start with `EADDRINUSE`, disable AirPlay Receiver under **System Settings → General → AirDrop & Handoff**, or temporarily set another `PORT` in `backend/.env` and match `NEXT_PUBLIC_API_URL` in the frontend.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Core Business Concept

The platform is organized around **Olympiad Year** (for example `2026-2027`), not academic year or academic session.

- Schools do not self-register
- Students do not self-register
- Only Admin has login access
- Registration records are independent per Olympiad Year

Business modules will be implemented in later phases.

## Phase 1 Scope

This phase covers project scaffolding only:

- Separate frontend and backend apps
- Health API
- Prisma + PostgreSQL readiness
- Basic admin placeholders
- Design system foundation
