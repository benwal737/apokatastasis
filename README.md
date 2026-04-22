# Apokatastasis

Multi-perspective live streaming platform with real-time chat and WebRTC video. Built to explore advanced real-time communication technologies.

**Status:** Feature-complete prototype. Development paused to focus on other projects.

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
