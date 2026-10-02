import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { pool } from "./pool";
export { pool, databaseConfigured } from "./pool";
export * from "./creature-store";

export const db = drizzle(pool, { schema });

export * from "./schema";

export * from "./creature-identity";

export * from "./creature-reference";

export * from "./check-reference-status";

export * from "./exhibit-taxonomy";
export * from "./classify-exhibit";

export * from "./creature-names";
