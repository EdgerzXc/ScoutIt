# 🚀 Future Scaling Roadmap & Architecture Possibilities

As ScoutIt grows in users, data volume, and traffic, our infrastructure must evolve. The current stack (Vercel + Next.js + Supabase + Airtable) is incredibly robust for our MVP and initial scaling phases. It natively handles CDN distribution, Edge Load Balancing, and basic Object Storage without complex DevOps configurations.

However, as we hit enterprise-level scale, the Council of Architects has identified the following strategic upgrades. These should only be implemented **when specific bottlenecks are reached**, avoiding premature optimization.

---

## 🟡 Phase 1: Near-Term Upgrades (100–1,000 active users)
*These features protect our API quotas and ensure the site remains responsive under moderate load spikes.*

### 1. Redis Caching for Airtable (`api/cms`)
**The Problem:** Airtable enforces a strict rate limit of 5 requests per second. A sudden surge in traffic will cause the API to block our requests, breaking the public directory.
**The Solution:** Integrate a Redis instance (e.g., Upstash) to cache the results of Airtable queries for 5–10 minutes.
- **Trigger point:** When we start seeing `429 Too Many Requests` errors from Airtable in our Sentry logs.

### 2. Edge Rate Limiting
**The Problem:** Malicious bots or scrapers could spam our open API endpoints (like the Mapbox geocoding proxy), racking up massive third-party API bills.
**The Solution:** Implement Vercel Edge Middleware or Upstash Redis Rate Limiting to restrict IP addresses to a reasonable number of requests per minute.
- **Trigger point:** When unexpected spikes in Vercel function invocations or Mapbox usage occur.

### 3. Asynchronous Message Queues (Inngest or QStash)
**The Problem:** Vercel serverless functions timeout after 10–60 seconds. If a user submits a Deep Intelligence Studio form that triggers heavy AI synthesis, bulk email generation, or PDF generation, the connection will drop.
**The Solution:** Use a message queue (like Inngest or Upstash QStash) to acknowledge the request instantly, process the heavy workload in the background, and notify the user when it finishes.
- **Trigger point:** When deploying heavy AI features or background reporting tasks.

---

## 🟠 Phase 2: Mid-Term Upgrades (1,000–10,000 active properties)
*These features address data heavy-lifting and complex search patterns.*

### 4. Dedicated Search Index (Algolia or Meilisearch)
**The Problem:** Currently, property radius filtering (Haversine distance) and text searching happen in JavaScript on the client or server. As the directory scales to thousands of properties, pulling all that data into memory for filtering will destroy performance.
**The Solution:** Sync our Airtable/Supabase data to a dedicated search index engine like Algolia or Meilisearch. These services provide instant, typo-tolerant, geographically aware search queries.
- **Trigger point:** When the `/api/cms` payload becomes too large (>2MB) or search operations take longer than 500ms.

### 5. Fixing React Render Loops (Interactive Maps)
**The Problem:** The `InteractiveMap` and local syncing mechanisms (`ResidentialFlow.js`) have a `useEffect` loop caused by `requestAnimationFrame`. This consumes main-thread cycles and impacts Time to Interactive (TTI).
**The Solution:** Refactor the Mapbox component integration to decouple React state from the Mapbox internal render loop. Use refs (`useRef`) to track map state instead of triggering React re-renders on every pan/zoom frame.
- **Trigger point:** Immediate priority for the next frontend performance sprint to achieve 95+ Lighthouse scores.

---

## 🔴 Phase 3: Long-Term Enterprise Upgrades (Massive Scale)
*These features are strictly for when ScoutIt becomes a massive global platform. Implementing these too early will cause unnecessary DevOps friction.*

### 6. Circuit Breakers
**The Concept:** If Airtable or a third-party service experiences an outage, a circuit breaker prevents our server from repeatedly trying and failing to connect, which cascades the failure through our system. It immediately returns a fallback UI.
**Current State:** Next.js Error Boundaries (`error.js`) suffice for now.
**Trigger point:** When we rely on multiple fragile microservices that frequently go down.

### 7. Database Read Replicas
**The Concept:** Distributing database read queries across multiple geographic servers to reduce load on the primary Supabase PostgreSQL instance.
**Current State:** Supabase handles massive read volume easily, and our public data is offloaded to Airtable anyway.
**Trigger point:** When Supabase metrics show sustained 80%+ CPU utilization on the database instance.

### 8. Custom Application Load Balancers (ALB)
**The Concept:** Manual load balancing rules and traffic routing.
**Current State:** Handled flawlessly by Vercel's Edge Network.
**Trigger point:** Only necessary if we migrate away from Vercel to raw AWS EC2/ECS infrastructure.

---
*Documented by the AI Architecture Council on 2026-06-29.*
