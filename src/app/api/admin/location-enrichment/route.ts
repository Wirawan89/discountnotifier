import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function taskArgs(task: {
  id: number;
  deepMode: boolean;
  maxPages: number;
  categoryIds?: number[];
  category?: { name: string } | null;
}, categoryNames: string[]) {
  const args = [
    "tsx",
    "scripts/run-location-enrichment.ts",
    `--taskId=${task.id}`,
    `--maxChecked=${task.deepMode ? task.maxPages : Math.min(task.maxPages, 8)}`,
    `--maxLocations=${task.deepMode ? 100 : 40}`,
    "--limit=250",
  ];

  if (categoryNames.length > 0) {
    args.push(`--categories=${categoryNames.join(",")}`);
  } else if (task.category?.name) {
    args.push(`--categories=${task.category.name}`);
  }

  return args;
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const taskId = Number(body.taskId);

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.adminScheduledTask.findUnique({
      where: { id: taskId },
      include: { category: { select: { name: true } } },
    });

    if (!task || task.taskType !== "location_enrichment") {
      return NextResponse.json({ error: "Location enrichment task not found" }, { status: 404 });
    }

    const categoryNames =
      task.categoryIds.length > 0
        ? (
            await prisma.category.findMany({
              where: {
                id: {
                  in: task.categoryIds,
                },
              },
              select: {
                name: true,
              },
              orderBy: {
                name: "asc",
              },
            })
          ).map((category) => category.name)
        : [];

    const logsDir = path.join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `location-enrichment-${task.id}-${Date.now()}.log`);
    const logStream = createWriteStream(logPath, { flags: "a" });
    const child = spawn("npx", taskArgs(task, categoryNames), {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);
    child.unref();

    await prisma.adminScheduledTask.update({
      where: { id: task.id },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: "running",
        lastRunMessage: `Manual location enrichment started. Log: ${logPath}`,
      },
    });

    return NextResponse.json({
      message: "Location enrichment started.",
      pid: child.pid,
      logPath,
    });
  } catch (error) {
    console.error("Location enrichment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
