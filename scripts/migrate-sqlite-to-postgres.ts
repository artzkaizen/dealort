#!/usr/bin/env bun
/**
 * Migration script to transfer data from SQLite to PostgreSQL
 *
 * Usage:
 *   1. Ensure PostgreSQL is running (docker-compose up -d postgres)
 *   2. Ensure SQLite database exists at the path specified in OLD_DATABASE_URL
 *   3. Run: bun scripts/migrate-sqlite-to-postgres.ts
 */

import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env" });

const OLD_DATABASE_URL =
  process.env.OLD_DATABASE_URL ||
  "file:/home/morse-code/projects/dealort/apps/server/local.db";
const NEW_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/dealort";

if (
  !(
    NEW_DATABASE_URL.startsWith("postgresql://") ||
    NEW_DATABASE_URL.startsWith("postgres://")
  )
) {
  console.error("❌ NEW_DATABASE_URL must be a PostgreSQL connection string");
  process.exit(1);
}

console.log("🔄 Starting SQLite to PostgreSQL migration...");
console.log(`📦 Source: ${OLD_DATABASE_URL}`);
console.log(`🎯 Target: ${NEW_DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

// Connect to SQLite
const sqliteClient = createClient({
  url: OLD_DATABASE_URL,
});

// Connect to PostgreSQL
const pgClient = postgres(NEW_DATABASE_URL);

// List of tables to migrate (in dependency order)
const tables = [
  "user",
  "organization",
  "account",
  "session",
  "verification",
  "passkey",
  "two_factor",
  "member",
  "invitation",
  "rate_limit",
  "organization_impression",
  "follow",
  "organization_reference",
  "review",
  "comment",
  "comment_like",
  "report",
  "waitlist",
];

async function migrateTable(tableName: string) {
  try {
    console.log(`\n📊 Migrating table: ${tableName}`);

    // Get all rows from SQLite
    const result = await sqliteClient.execute(`SELECT * FROM ${tableName}`);
    const rows = result.rows as Array<Record<string, unknown>>;

    if (rows.length === 0) {
      console.log("   ⏭️  No data to migrate");
      return;
    }

    console.log(`   📥 Found ${rows.length} rows`);

    // Get column names
    const columns = Object.keys(rows[0]);

    // Build INSERT statement
    const columnNames = columns.join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const insertQuery = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    // Insert rows in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        const values = columns.map((col) => {
          const value = row[col];
          // Handle JSON fields
          if (
            typeof value === "string" &&
            (value.startsWith("[") || value.startsWith("{"))
          ) {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }
          return value;
        });

        try {
          await pgClient.unsafe(insertQuery, values);
          inserted++;
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            error.message.includes("duplicate key")
          ) {
            // Skip duplicates
            continue;
          }
          console.error("   ❌ Error inserting row:", error);
          throw error;
        }
      }
    }

    console.log(`   ✅ Migrated ${inserted} rows`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("does not exist")) {
      console.log("   ⏭️  Table does not exist in source database");
      return;
    }
    console.error(`   ❌ Error migrating table ${tableName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Test connections
    console.log("\n🔌 Testing connections...");
    await sqliteClient.execute("SELECT 1");
    await pgClient`SELECT 1`;
    console.log("✅ Both databases connected");

    // Migrate tables in order
    for (const table of tables) {
      await migrateTable(table);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify data in PostgreSQL using: bun run db:studio");
    console.log("   2. Test your application");
    console.log("   3. Once verified, you can remove the SQLite database file");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sqliteClient.close();
    await pgClient.end();
  }
}

main();
