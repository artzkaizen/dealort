# dealort

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine (Docker for development)
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d postgres
```

Or use the convenience script:

```bash
bun run db:local
```

2. Update your `.env` file with the PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/dealort"
```

3. Apply the schema to your database:

```bash
bun run db:push
```

### Migrating Data from SQLite (if applicable)

If you have existing data in SQLite that needs to be migrated:

1. Ensure PostgreSQL is running (step 1 above)
2. Set `OLD_DATABASE_URL` in your `.env` file to point to your SQLite database:
   ```bash
   OLD_DATABASE_URL="file:/path/to/your/local.db"
   ```
3. Run the migration script:
   ```bash
   bun scripts/migrate-sqlite-to-postgres.ts
   ```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
dealort/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono, ORPC)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
- `bun run db:local`: Start the PostgreSQL database (Docker Compose)
- `docker-compose down`: Stop the PostgreSQL database
