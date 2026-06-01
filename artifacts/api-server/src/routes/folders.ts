import { Router } from "express";
import { db } from "@workspace/db";
import { foldersTable, projectsTable } from "@workspace/db";
import { eq, isNull, count } from "drizzle-orm";
import {
  CreateFolderBody,
  UpdateFolderParams,
  UpdateFolderBody,
  DeleteFolderParams,
} from "@workspace/api-zod";

const router = Router();

type FolderNode = {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: Date;
  children: FolderNode[];
  projectCount: number;
};

function buildTree(folders: FolderNode[], parentId: number | null = null): FolderNode[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({
      ...f,
      children: buildTree(folders, f.id),
    }));
}

router.get("/folders", async (req, res) => {
  const folders = await db.select().from(foldersTable);
  const projectCounts = await db
    .select({ folderId: projectsTable.folderId, cnt: count() })
    .from(projectsTable)
    .groupBy(projectsTable.folderId);

  const countMap = new Map<number, number>();
  for (const row of projectCounts) {
    if (row.folderId !== null) countMap.set(row.folderId, Number(row.cnt));
  }

  const nodes: FolderNode[] = folders.map((f) => ({
    ...f,
    parentId: f.parentId ?? null,
    children: [],
    projectCount: countMap.get(f.id) ?? 0,
  }));

  const tree = buildTree(nodes);
  res.json(tree);
});

router.post("/folders", async (req, res) => {
  const body = CreateFolderBody.parse(req.body);
  const [folder] = await db
    .insert(foldersTable)
    .values({ name: body.name, parentId: body.parentId ?? null })
    .returning();
  res.status(201).json({ ...folder, children: [], projectCount: 0 });
});

router.patch("/folders/:id", async (req, res) => {
  const { id } = UpdateFolderParams.parse({ id: Number(req.params.id) });
  const body = UpdateFolderBody.parse(req.body);

  const existing = await db.select().from(foldersTable).where(eq(foldersTable.id, id));
  if (existing.length === 0) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  const updates: Partial<{ name: string; parentId: number | null }> = {};
  if (body.name !== undefined) updates.name = body.name;
  if ("parentId" in body) updates.parentId = body.parentId ?? null;

  const [updated] = await db.update(foldersTable).set(updates).where(eq(foldersTable.id, id)).returning();
  res.json({ ...updated, children: [], projectCount: 0 });
});

router.delete("/folders/:id", async (req, res) => {
  const { id } = DeleteFolderParams.parse({ id: Number(req.params.id) });

  const existing = await db.select().from(foldersTable).where(eq(foldersTable.id, id));
  if (existing.length === 0) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  await db.update(projectsTable).set({ folderId: null }).where(eq(projectsTable.folderId, id));
  await db.update(foldersTable).set({ parentId: null }).where(eq(foldersTable.parentId, id));
  await db.delete(foldersTable).where(eq(foldersTable.id, id));
  res.status(204).send();
});

export default router;
