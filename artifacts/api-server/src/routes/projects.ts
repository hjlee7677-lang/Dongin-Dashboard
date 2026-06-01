import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, foldersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/projects/recent", async (req, res) => {
  const rows = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      description: projectsTable.description,
      url: projectsTable.url,
      creator: projectsTable.creator,
      folderId: projectsTable.folderId,
      folderName: foldersTable.name,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .leftJoin(foldersTable, eq(projectsTable.folderId, foldersTable.id))
    .orderBy(desc(projectsTable.createdAt))
    .limit(6);

  res.json(rows.map((r) => ({ ...r, folderName: r.folderName ?? null })));
});

router.get("/projects", async (req, res) => {
  const rawFolderId = req.query.folderId;
  const parsedFolderId =
    rawFolderId !== undefined && rawFolderId !== "" && rawFolderId !== "null"
      ? Number(rawFolderId)
      : null;

  const query = ListProjectsQueryParams.parse({
    folderId: parsedFolderId,
  });

  let rows;
  if (query.folderId !== undefined && query.folderId !== null) {
    rows = await db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        description: projectsTable.description,
        url: projectsTable.url,
        creator: projectsTable.creator,
        folderId: projectsTable.folderId,
        folderName: foldersTable.name,
        createdAt: projectsTable.createdAt,
      })
      .from(projectsTable)
      .leftJoin(foldersTable, eq(projectsTable.folderId, foldersTable.id))
      .where(eq(projectsTable.folderId, query.folderId))
      .orderBy(desc(projectsTable.createdAt));
  } else {
    rows = await db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        description: projectsTable.description,
        url: projectsTable.url,
        creator: projectsTable.creator,
        folderId: projectsTable.folderId,
        folderName: foldersTable.name,
        createdAt: projectsTable.createdAt,
      })
      .from(projectsTable)
      .leftJoin(foldersTable, eq(projectsTable.folderId, foldersTable.id))
      .orderBy(desc(projectsTable.createdAt));
  }

  res.json(rows.map((r) => ({ ...r, folderName: r.folderName ?? null })));
});

router.post("/projects", async (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const [project] = await db
    .insert(projectsTable)
    .values({
      title: body.title,
      description: body.description ?? null,
      url: body.url,
      creator: body.creator,
      folderId: body.folderId ?? null,
    })
    .returning();

  let folderName: string | null = null;
  if (project.folderId !== null) {
    const folder = await db.select().from(foldersTable).where(eq(foldersTable.id, project.folderId));
    folderName = folder[0]?.name ?? null;
  }

  res.status(201).json({ ...project, folderName });
});

router.get("/projects/:id", async (req, res) => {
  const { id } = GetProjectParams.parse({ id: Number(req.params.id) });

  const rows = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      description: projectsTable.description,
      url: projectsTable.url,
      creator: projectsTable.creator,
      folderId: projectsTable.folderId,
      folderName: foldersTable.name,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .leftJoin(foldersTable, eq(projectsTable.folderId, foldersTable.id))
    .where(eq(projectsTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const row = rows[0];
  res.json({ ...row, folderName: row.folderName ?? null });
});

router.patch("/projects/:id", async (req, res) => {
  const { id } = UpdateProjectParams.parse({ id: Number(req.params.id) });
  const body = UpdateProjectBody.parse(req.body);

  const existing = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (existing.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const updates: Partial<{
    title: string;
    description: string | null;
    url: string;
    creator: string;
    folderId: number | null;
  }> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description ?? null;
  if (body.url !== undefined) updates.url = body.url;
  if (body.creator !== undefined) updates.creator = body.creator;
  if ("folderId" in body) updates.folderId = body.folderId ?? null;

  const [updated] = await db.update(projectsTable).set(updates).where(eq(projectsTable.id, id)).returning();

  let folderName: string | null = null;
  if (updated.folderId !== null) {
    const folder = await db.select().from(foldersTable).where(eq(foldersTable.id, updated.folderId));
    folderName = folder[0]?.name ?? null;
  }

  res.json({ ...updated, folderName });
});

router.delete("/projects/:id", async (req, res) => {
  const { id } = DeleteProjectParams.parse({ id: Number(req.params.id) });

  const existing = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (existing.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.status(204).send();
});

export default router;
