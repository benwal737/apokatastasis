# Apokatastasis

Multi-perspective live streaming platform with real-time chat and WebRTC video. Built to explore advanced real-time communication technologies.

**Status:** Feature-complete prototype. Development paused to focus on SlugTrail capstone project.

---

## Overview

Apokatastasis is a live streaming platform that allows multiple broadcasters to stream simultaneously to the same room, each from their own perspective (POV). Viewers can watch all streams in real-time and participate in live chat.

**Key Innovation:** Unlike traditional streaming platforms (Twitch, YouTube) where one person streams to many viewers, Apokatastasis supports **multiple concurrent broadcasters** in a single room - enabling collaborative streaming experiences like gaming tournaments, panel discussions, or multi-angle event coverage.

---

## Tech Stack

**Frontend**
- Next.js 15.5 (App Router)
- React 19, TypeScript
- Tailwind CSS 4
- shadcn/ui components
- Radix UI primitives

**Real-time Technologies**
- **LiveKit** - WebRTC abstraction for browser-based streaming
  - Client SDK for video/audio capture
  - Server SDK for token generation
  - React components for stream management
- **Socket.io** - Real-time chat messaging
  - Custom Next.js server integration
  - Persistent message history

**Backend**
- Next.js Server Actions
- PostgreSQL database
- Prisma ORM

**Authentication**
- Clerk (OAuth provider)
- Webhook sync to local database

**Form Handling**
- React Hook Form
- Zod schema validation

---

## Features Implemented

### 1. Room System
- Create rooms with customizable names
- Host-only join codes for streamer access
- Public room discovery ("For You" feed)
- Room deletion with automatic participant cleanup

### 2. Multi-POV Live Streaming
- Browser-based WebRTC streaming (no external software needed)
- Multiple streamers broadcast to the same room simultaneously
- Each stream labeled with broadcaster's perspective (POV)
- Camera and microphone toggle
- Device switching (multiple cameras/mics)
- Camera flip for mobile devices

### 3. Real-time Chat
- Socket.io-powered live chat per room
- Optional (can be disabled by room creator)
- Persistent message history in PostgreSQL
- Real-time message delivery to all participants

### 4. Host Moderation Controls
- End individual participant streams
- End all streams at once
- Delete room (automatically kicks all participants)
- Streamer permission management

### 5. User Profiles
- Clerk authentication with Google/GitHub OAuth
- Webhook-based user sync to PostgreSQL
- Usernames and avatars
- Profile pages

---

## Technical Highlights

### WebRTC & LiveKit Integration
- **Token-based permissions** - Server generates LiveKit tokens with role-based permissions (viewer vs publisher)
- **Media track management** - Attach/detach video and audio tracks dynamically
- **Device enumeration** - List and switch between cameras/microphones
- **Camera flip** - Front/rear camera switching for mobile browsers

### Real-time Architecture
- **Socket.io with Next.js** - Custom server integration for WebSocket communication
- **Room-based messaging** - Socket.io namespaces for isolated chat rooms
- **Persistent chat** - Messages stored in PostgreSQL, loaded on room join

### Database Design (Prisma)
```sql
Users → Rooms (one-to-many, creator relationship)
Rooms → POVs (one-to-many, streaming perspectives)
Rooms → Messages (one-to-many, chat history)
Users → POVs (one-to-many, participant streams)
```

### Authentication Flow
1. User authenticates via Clerk (Google/GitHub OAuth)
2. Clerk webhook sends user data to `/api/webhooks/clerk`
3. Backend syncs user to PostgreSQL (creates or updates record)
4. User session stored in Clerk, user data accessible via Prisma

---

## What I Learned

### Real-time Video Streaming
- LiveKit token generation and permission management
- WebRTC track handling (video/audio capture and playback)
- Browser media device APIs (getUserMedia, enumerateDevices)
- Video constraints (resolution, framerate, facingMode)

### Real-time Communication
- Socket.io event-driven architecture
- Custom Next.js server with Socket.io integration
- Room-based namespace pattern
- Handling connection/disconnection events

### Database & Auth
- Prisma schema design for streaming applications
- Clerk webhook integration for user sync
- Server Actions in Next.js App Router
- Optimistic UI updates with React state

### State Management
- React Context for room state (participants, chat, streams)
- Zustand for global UI state
- React Hook Form for complex form handling
- Zod for runtime validation

---

## Architecture Decisions

### Why LiveKit over Raw WebRTC?
- Abstracts complex WebRTC signaling
- Built-in TURN/STUN server fallback
- Automatic bandwidth adaptation
- Production-ready scalability

### Why Socket.io over LiveKit Chat?
- More flexible for custom chat features
- Persistent message history integration
- Familiar API for real-time events
- Easier to extend for future features

### Why Clerk over NextAuth?
- Better webhook support for user sync
- Built-in user management UI
- Multiple OAuth providers out of the box
- No database session management needed

---

## Planned Features (Not Implemented)

- **RTMP Ingress** - Stream from OBS/StreamLabs (schema exists, UI stubbed)
- **HLS/CDN Egress** - Record and distribute streams via CDN (schema exists)
- **Stream Recording** - Save broadcasts for playback (database field exists)
- **Viewer Count** - Real-time participant tracking
- **Reactions/Emojis** - Live emoji reactions during streams
- **Moderator Roles** - Grant moderation powers to non-hosts

---

## Development Experience

**Timeline:** Built over 3 months (Summer 2025)

**Team:** Solo project

**Why Paused:** Shifted focus to SlugTrail capstone project (which won first place at UCSC). May resume post-graduation.

**Challenges Overcome:**
- Integrating Socket.io with Next.js 15's App Router
- Managing WebRTC connection lifecycle
- Synchronizing Clerk auth with local database
- Handling multiple simultaneous video streams in browser

---

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# - Clerk keys
# - LiveKit credentials
# - Database URL

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

**Note:** Requires LiveKit Cloud account or self-hosted LiveKit server.

---

## Demo

**Live deployment:** [Not currently deployed]

**Screenshots:** [Add if you have them]

---

## Skills Demonstrated

- Real-time video streaming (WebRTC, LiveKit)
- Real-time messaging (Socket.io)
- Modern React patterns (Server Components, Server Actions)
- Database design for real-time applications
- OAuth authentication and webhook integration
- TypeScript for type-safe full-stack development
- Form validation and error handling
- Responsive UI design (Tailwind CSS)

---

## Contact

Built by **Ben Walderman**
- Portfolio: [benwalderman.vercel.app](https://benwalderman.vercel.app)
- GitHub: [@benwal737](https://github.com/benwal737)
- LinkedIn: [linkedin.com/in/benwalderman](https://linkedin.com/in/benwalderman)
