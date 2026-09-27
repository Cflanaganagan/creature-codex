import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { pool } from "./pool";
export { pool, databaseConfigured } from "./pool";
export * from "./creature-store";

export const db = drizzle(pool, { schema });

export * from "./schema";

export * from "./creature-identity";
