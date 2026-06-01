import { Router } from "express";
import { db } from "@workspace/db";
import { foldersTable, projectsTable } from "@workspace/db";
import { count, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const [projectCountRow] = await db.select({ cnt: count() }).from(projectsTable);
  const [folderCountRow] = await db.select({ cnt: count() }).from(foldersTable);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentCountRow] = await db
    .select({ cnt: count() })
    .from(projectsTable)
    .where(gte(projectsTable.createdAt, sevenDaysAgo));

  res.json({
    totalProjects: Number(projectCountRow.cnt),
    totalFolders: Number(folderCountRow.cnt),
    recentCount: Number(recentCountRow.cnt),
  });
});

export default router;
