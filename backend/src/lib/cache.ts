/**
 * Result lookup cache: in-process memory + optional Redis (REDIS_URL).
 * Version bump invalidates all public result caches after admin writes/imports.
 */
import Redis from "ioredis";

type MemoryEntry = { value: string; expiresAt: number };

const memory = new Map<string, MemoryEntry>();
const MEMORY_MAX = 50_000;

let redis: Redis | null = null;
let redisFailed = false;
let memoryVersion = 1;

const ttlSeconds = () =>
  Math.max(30, Number(process.env.RESULT_CACHE_TTL_SECONDS || 600));

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url || redisFailed) return null;
  if (redis) return redis;
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    redis.on("error", () => {
      /* memory fallback remains available */
    });
    return redis;
  } catch {
    redisFailed = true;
    return null;
  }
}

async function ensureRedis(): Promise<Redis | null> {
  const client = getRedis();
  if (!client) return null;
  if (client.status === "wait") {
    try {
      await client.connect();
    } catch {
      redisFailed = true;
      return null;
    }
  }
  if (client.status !== "ready" && client.status !== "connecting") {
    return null;
  }
  return client;
}

function memorySet(key: string, value: string, ttl: number) {
  if (memory.size >= MEMORY_MAX) {
    const drop = Math.ceil(MEMORY_MAX * 0.1);
    let i = 0;
    for (const k of memory.keys()) {
      memory.delete(k);
      if (++i >= drop) break;
    }
  }
  memory.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

export const resultCache = {
  backend(): "redis" | "memory" {
    return process.env.REDIS_URL?.trim() && !redisFailed ? "redis" : "memory";
  },

  async getVersion(): Promise<number> {
    const client = await ensureRedis();
    if (client) {
      try {
        const v = await client.get("icape:result-cache:version");
        if (v) return Number(v) || 1;
      } catch {
        /* fallback */
      }
    }
    return memoryVersion;
  },

  async bumpVersion(): Promise<number> {
    memory.clear();
    const client = await ensureRedis();
    if (client) {
      try {
        const next = await client.incr("icape:result-cache:version");
        memoryVersion = next;
        return next;
      } catch {
        /* fallback */
      }
    }
    memoryVersion += 1;
    return memoryVersion;
  },

  async get<T>(key: string): Promise<T | null> {
    const client = await ensureRedis();
    if (client) {
      try {
        const raw = await client.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        /* fallback to memory */
      }
    }
    const raw = memoryGet(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttl = ttlSeconds()): Promise<void> {
    const raw = JSON.stringify(value);
    memorySet(key, raw, ttl);
    const client = await ensureRedis();
    if (client) {
      try {
        await client.set(key, raw, "EX", ttl);
      } catch {
        /* memory already set */
      }
    }
  },

  studentKey(
    version: number,
    olympiadYear: string,
    registrationNumber: string,
    grade: number,
  ) {
    return `icape:v${version}:student:${olympiadYear}:${registrationNumber}:${grade}`;
  },

  schoolSearchKey(
    version: number,
    olympiadYear: string,
    q: string,
    limit: number,
  ) {
    return `icape:v${version}:school-search:${olympiadYear}:${q.toLowerCase()}:${limit}`;
  },

  schoolResultsKey(
    version: number,
    olympiadYear: string,
    schoolKey: string,
    olympiad: string,
    grade: string,
    student: string,
    page: number,
    limit: number,
  ) {
    return `icape:v${version}:school-results:${olympiadYear}:${schoolKey}:${olympiad}:${grade}:${student}:${page}:${limit}`;
  },

  metaKey(version: number) {
    return `icape:v${version}:meta`;
  },
};
