# Rasna - Architecture Summary (Presentation Version)

## 🎯 System Overview

**Rasna** is a modern family dashboard application built with a serverless architecture, providing real-time coordination, reminders, and memory preservation for families.

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                            │
│              (Family Members - Web Browser)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL PLATFORM                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 15 Application (Serverless)                 │   │
│  │  • Frontend: React 19 + TypeScript + Tailwind CSS   │   │
│  │  • Backend: API Routes (Serverless Functions)       │   │
│  │  • Cron Jobs: Scheduled Tasks (8 AM & 9 AM UTC)      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ API Calls
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE PLATFORM                         │
│  • Authentication Service (Email + Password)                │
│  • PostgreSQL Database (7 tables with RLS)                 │
│  • Storage Service (Photo uploads)                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ External APIs
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
│  • Twilio (WhatsApp + SMS Notifications)                    │
│  • OpenAI (Daily Motivational Quotes)                       │
│  • Quotable API (Fallback Quotes)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **profiles** | Family member information | id, name, email, phone_number, notifications_enabled |
| **events** | Calendar events | id, title, date, time, category, created_by |
| **tasks** | To-do items | id, title, due_date, assigned_to, completed |
| **notes** | Important information | id, title, content, category |
| **announcements** | Quick messages | id, message, expires_at |
| **memories** | Photo gallery | id, photo_url, note |
| **app_settings** | Global settings | notifications_enabled, enable_sms, enable_whatsapp |

### Security
- **Row Level Security (RLS)** enabled on all tables
- **User-based access control** via RLS policies
- **Service Role Key** for system operations (cron jobs)

---

## 🔔 Notification System

### Daily Good Morning (8:00 AM UTC)
```
Vercel Cron → API Endpoint → Supabase (Get Profiles)
                              ↓
                         OpenAI API (Get Quote)
                              ↓
                         Twilio WhatsApp (Send Messages)
                              ↓
                         Family Members Receive Messages
```

### Event/Task Reminders (9:00 AM UTC)
```
Vercel Cron → API Endpoint → Supabase (Get Events/Tasks)
                              ↓
                         Supabase (Get Profiles)
                              ↓
                         Twilio (WhatsApp + SMS)
                              ↓
                         Family Members Receive Reminders
```

### Features
- ✅ **WhatsApp** notifications (daily quotes + reminders)
- ✅ **SMS** notifications (reminders only)
- ✅ **App-level controls** (enable/disable globally)
- ✅ **User-level controls** (per-user preferences)
- ✅ **Rate limit handling** (auto-disable on limit)
- ✅ **Fallback mechanisms** (Quotable API if OpenAI fails)

---

## 🔐 Authentication & Security

### Authentication Flow
1. **User Registration/Login** → Supabase Auth
2. **Session Management** → JWT tokens in HTTP-only cookies
3. **Route Protection** → Next.js Middleware
4. **Database Access** → Row Level Security (RLS)

### Security Layers
- **Layer 1:** Supabase Authentication (Email + Password)
- **Layer 2:** Next.js Middleware (Route Protection)
- **Layer 3:** Row Level Security (Database Access Control)

---

## 🚀 Deployment Architecture

### Vercel Platform
- **Hosting:** Serverless functions + Static assets
- **CDN:** Global content delivery
- **Cron Jobs:** Scheduled task execution
- **Environment Variables:** Secure secret management

### Deployment Flow
```
GitHub Repository
    ↓ (Push to main)
Vercel Auto-Deploy
    ↓
Build & Deploy
    ↓
Production Environment
    ↓
rasna.vercel.app (Live)
```

---

## 🔧 Environment Variables

### Required Variables

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for cron jobs)

**Twilio:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (SMS)
- `TWILIO_WHATSAPP_NUMBER`

**OpenAI:**
- `OPENAI_API_KEY`

### Optional Variables
- `CRON_SECRET` (for manual testing)
- `NEXT_PUBLIC_SITE_URL`

---

## 📱 Application Features

### Core Features
1. ✅ **Authentication** - Email + password, session management
2. ✅ **Family Calendar** - Events with categories, dates, times
3. ✅ **To-Do Lists** - Tasks with due dates, assignments
4. ✅ **Family Notes** - Important information storage
5. ✅ **Announcements** - Quick family messages
6. ✅ **Family Memories** - Photo gallery with notes

### Notification Features
7. ✅ **Daily Good Morning** - WhatsApp messages with quotes
8. ✅ **Event Reminders** - WhatsApp + SMS (1 day before)
9. ✅ **Task Reminders** - WhatsApp + SMS (1 day before)
10. ✅ **Notification Controls** - App-level & user-level settings

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Date Handling:** date-fns

### Backend
- **API:** Next.js API Routes (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage

### External Services
- **Notifications:** Twilio (WhatsApp + SMS)
- **Quotes:** OpenAI API + Quotable API (fallback)
- **Deployment:** Vercel

### Development Tools
- **Package Manager:** npm
- **Version Control:** Git + GitHub
- **Linting:** ESLint

---

## 📈 System Reliability

### Error Handling
- Graceful degradation (fallback services)
- Rate limit detection & auto-disable
- Comprehensive error logging
- User-friendly error messages

### Monitoring
- Vercel Logs (runtime monitoring)
- Vercel Cron execution history
- Twilio delivery status tracking
- Supabase query performance

### Scalability
- Serverless architecture (auto-scaling)
- CDN for static assets
- Database connection pooling
- Efficient query patterns

---

## 🎯 Key Differentiators

1. **Serverless Architecture** - Auto-scaling, cost-effective
2. **Real-time Notifications** - WhatsApp + SMS integration
3. **AI-Powered Quotes** - Daily motivational messages
4. **Family-Focused Design** - Calm, supportive UI
5. **Secure by Default** - RLS, authentication, route protection
6. **Production-Ready** - Error handling, monitoring, logging

---

## 📊 System Metrics

- **Response Time:** < 200ms (API routes)
- **Uptime:** 99.9% (Vercel SLA)
- **Database:** PostgreSQL with connection pooling
- **Storage:** CDN-backed (Supabase Storage)
- **Notifications:** Real-time delivery (Twilio)

---

## 🔄 Data Flow Example

### Creating an Event
```
User Input → Next.js API Route → Supabase Database
                                    ↓
                            RLS Policy Check
                                    ↓
                            Data Saved
                                    ↓
                            Response to User
                                    ↓
                            UI Updated
```

### Sending Notifications
```
Vercel Cron (9 AM UTC) → API Route → Supabase (Get Events)
                                            ↓
                                    Supabase (Get Profiles)
                                            ↓
                                    Format Messages
                                            ↓
                                    Twilio API
                                            ↓
                                    WhatsApp + SMS Sent
```

---

## ✅ Production Checklist

- [x] Environment variables configured
- [x] Database migrations applied
- [x] RLS policies enabled
- [x] Cron jobs configured
- [x] Error handling implemented
- [x] Logging configured
- [x] Rate limiting handled
- [x] Security measures in place

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Production Ready ✅

