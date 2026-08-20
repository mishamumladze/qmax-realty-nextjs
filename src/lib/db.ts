import Database from "better-sqlite3";
import path from "path";
import { Property } from "@/types/property";

const dbPath = path.join(process.cwd(), "data", "qmax.sqlite");

export function getActiveProperties(): Property[] {
  const db = new Database(dbPath);
  
  // Exclude throwaway test rows and filter by active status
  const stmt = db.prepare(`
    SELECT * FROM properties 
    WHERE status = 'active' 
      AND slug NOT LIKE 'throwaway-%'
    ORDER BY id ASC
  `);

  return stmt.all() as Property[];
}