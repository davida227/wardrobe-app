# Wardrobe — AI-Powered Personal Stylist

[![Docker Image](https://ghcr.io/davida227/wardrobe-app)](https://github.com/davida227/wardrobe-app/pkgs/container/wardrobe-app)
[![CI/CD](https://github.com/davida227/wardrobe-app/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/davida227/wardrobe-app/actions/workflows/docker-publish.yml)

A full-stack web application that helps you manage your wardrobe and generate outfit suggestions using AI. Built with Next.js, Supabase, and Claude.

## Features

### Wardrobe Management
- **Upload & Analyze** — Take a photo of a clothing item. Claude automatically extracts the name, category, color, pattern, fabric, formality level, and styling notes
- **Browse Grid** — View all your clothes as thumbnails with hover previews
- **Filter by Category** — Organize by Tops, Bottoms, Outerwear, Shoes, Accessories, Dresses, Activewear, or Formal wear
- **Persistent Storage** — Images and metadata stored on Supabase

### Outfit Generation
- **AI Suggestions** — Generate outfit combinations from your wardrobe using Claude
- **Filter by Occasion** — Specify the event (work, date night, casual, etc.) for tailored suggestions
- **Save Favorites** — Keep outfits you like for quick reference later

### Outfit History
- **Log Your Day** — Record what you wore on specific dates
- **Add Context** — Include the occasion, event/location, and personal notes
- **Visual Reference** — Tagged items appear as thumbnails on each entry

### Authentication
- **Simple & Fast** — Email + password sign up (no confirmation email required)
- **Secure** — Passwords hashed by Supabase Auth, database access controlled by Row Level Security (RLS)

## Tech Stack

- **Frontend** — Next.js 15 (React, TypeScript, Tailwind CSS)
- **Backend** — Next.js API routes
- **Database & Auth** — Supabase (PostgreSQL, GoTrue)
- **Storage** — Supabase Storage (for images)
- **AI** — Claude (Sonnet 4.6) via Anthropic API
- **Deployment** — Vercel (frontend), GHCR (Docker image)
- **Containerization** — Docker & Docker Compose

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase account (free tier works)
- Anthropic API key

### Local Development (without Docker)

1. **Clone the repo**
   ```bash
   git clone https://github.com/davida227/wardrobe-app.git
   cd wardrobe-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase URL, anon key, and Anthropic API key.

3. **Set up Supabase**
   - Go to your Supabase project → SQL Editor
   - Run the migration in `supabase/migration.sql`
   - This creates the tables, RLS policies, and auth triggers

4. **Install dependencies and run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000

### Local Development (with Docker)

1. **Create a `.env` file**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and Anthropic keys.

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the app**
   Open http://localhost:3000

4. **Stop**
   ```bash
   docker-compose down
   ```

## Project Structure

```
wardrobe-app/
├── app/                     # Next.js app directory
│   ├── wardrobe/           # Wardrobe grid + filter
│   ├── wardrobe/add/       # Photo upload & AI analysis
│   ├── history/            # Outfit history log
│   ├── outfits/            # AI outfit generator
│   ├── auth/               # Auth routes (callbacks)
│   └── api/                # API endpoints for AI
├── components/             # Reusable React components
├── lib/                    # Utilities (Supabase clients, types, image utils)
├── supabase/               # Database schema & migrations
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Local dev orchestration
└── .github/workflows/      # CI/CD (auto-publish Docker image on merge to main)
```

## How It Works

### Adding a Clothing Item

1. Navigate to the **Add** tab
2. Upload a photo (drag & drop or tap)
3. Claude analyzes the image and pre-fills name, category, color, pattern, fabric, formality, seasons, and styling notes
4. Review and edit the fields
5. Click **Save to Wardrobe** — image and thumbnail stored in Supabase

### Generating Outfit Suggestions

1. Navigate to the **Outfits** tab
2. Optionally filter by occasion
3. Click **Generate** — Claude suggests 4 complete outfits from your wardrobe
4. Each suggestion includes styling tips and the specific items to wear
5. Click **Save** to keep any outfit for later

### Logging Your Day

1. Navigate to the **History** tab
2. Click **Log Outfit**
3. Enter date, occasion, event/location, and personal notes
4. Optionally tag the items you wore
5. Click **Save Entry** — appears in your chronological feed

## API Endpoints

### `POST /api/analyze-clothing`
Analyzes a clothing image using Claude's vision capabilities.

**Request:**
```json
{ "imageBase64": "data:image/jpeg;base64,..." }
```

**Response:**
```json
{
  "name": "White Oxford Shirt",
  "category": "Tops",
  "color": "White",
  "pattern": "Solid",
  "fabric": "Cotton",
  "formality": "Smart Casual",
  "seasons": ["Spring", "Fall", "All Season"],
  "notes": "Versatile piece that pairs well with almost anything."
}
```

### `POST /api/generate-outfits`
Generates outfit suggestions from a user's wardrobe.

**Request:**
```json
{
  "items": [...],
  "occasion": "Work"
}
```

**Response:**
```json
{
  "outfits": [
    {
      "name": "Business Casual Monday",
      "description": "...",
      "occasion": "Work",
      "styling_tips": "...",
      "item_ids": ["id1", "id2", "id3"]
    }
  ]
}
```

## Docker

The app is containerized using a multi-stage Docker build and auto-published to GitHub Container Registry (GHCR) on every merge to `main`.

**Pull the latest image:**
```bash
docker pull ghcr.io/davida227/wardrobe-app:latest
```

**Run:**
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=<your-url> \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key> \
  -e ANTHROPIC_API_KEY=<your-key> \
  ghcr.io/davida227/wardrobe-app:latest
```

See `Dockerfile` and `docker-compose.yml` for the full setup.

## CI/CD

Every merge to `main` automatically triggers a GitHub Actions workflow that:

1. Builds the Docker image
2. Tags it with `:latest` and the short commit SHA (e.g. `:a1b2c3d`)
3. Pushes both tags to GHCR

The commit SHA tag lets you trace exactly which version of the code is running in any deployed image.

**Check the latest workflow run:**
→ [Actions tab](https://github.com/davida227/wardrobe-app/actions/workflows/docker-publish.yml)

**Check published image versions:**
→ [Packages](https://github.com/davida227/wardrobe-app/pkgs/container/wardrobe-app)

## Security Considerations

- **Public Keys in Image** — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are baked into the Docker image at build time (they're designed to be public). Ensure your Supabase RLS policies are restrictive.
- **Secrets at Runtime** — `ANTHROPIC_API_KEY` is injected at runtime and never stored in the image.
- **Row Level Security** — All database tables have RLS policies ensuring users can only access their own data.
- **Non-Root Container** — The Docker container runs as an unprivileged user for security.

## Database Schema

See `supabase/migration.sql` for the full schema. Key tables:

- **`clothing_items`** — User's wardrobe items
- **`saved_outfits`** — Saved outfit combinations
- **`outfit_history`** — Log of outfits worn on specific dates
- **`user_profiles`** — User settings (auto-created on signup via database trigger)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit
3. Push and open a Pull Request against `main`
4. Once merged, the Docker image is automatically rebuilt and published

## License

MIT
