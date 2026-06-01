import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_TASKS = [
  {
    name: "Overnight offers:reverify",
    taskType: "offers_reverify",
    frequency: "daily",
    timeOfDay: "02:00",
    enabled: false,
    deepMode: true,
    maxPages: 12,
    notes: "Deep verification for existing store offers. Best for overnight maintenance.",
  },
  {
    name: "Deep Verify",
    taskType: "deep_verify",
    frequency: "weekly",
    timeOfDay: "03:00",
    dayOfWeek: 1,
    enabled: false,
    deepMode: true,
    maxPages: 12,
    notes: "Admin deep verification for selected category or all categories.",
  },
  {
    name: "Monthly new store discovery",
    taskType: "new_store_discovery",
    frequency: "monthly",
    timeOfDay: "04:00",
    dayOfMonth: 1,
    enabled: false,
    deepMode: true,
    maxPages: 12,
    notes: "Token-controlled discovery for new stores. Keep disabled until provider budget rules are configured.",
  },
  {
    name: "Location enrichment",
    taskType: "location_enrichment",
    frequency: "monthly",
    timeOfDay: "04:30",
    dayOfMonth: 2,
    enabled: false,
    deepMode: true,
    maxPages: 18,
    notes: "Revisit online chain stores, refresh branch locations nationally, then run offer verification for the category.",
  },
];

function parseTimeOfDay(timeOfDay: string) {
  const [hour = "2", minute = "0"] = timeOfDay.split(":");
  return {
    hour: Math.min(23, Math.max(0, Number(hour) || 0)),
    minute: Math.min(59, Math.max(0, Number(minute) || 0)),
  };
}

function getNextRunDate(task: {
  frequency: string;
  timeOfDay: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
}) {
  const now = new Date();
  const { hour, minute } = parseTimeOfDay(task.timeOfDay);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (task.frequency === "weekly") {
    const dayOfWeek = typeof task.dayOfWeek === "number" ? task.dayOfWeek : 1;
    const daysUntil = (dayOfWeek - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + daysUntil);
    if (next <= now) next.setDate(next.getDate() + 7);
    return next;
  }

  if (task.frequency === "monthly") {
    const dayOfMonth = Math.min(28, Math.max(1, task.dayOfMonth || 1));
    next.setDate(dayOfMonth);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return next;
  }

  if (task.frequency === "quarterly") {
    const dayOfMonth = Math.min(28, Math.max(1, task.dayOfMonth || 1));
    next.setDate(dayOfMonth);

    while (next <= now) {
      next.setMonth(next.getMonth() + 3);
    }

    return next;
  }

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function normalizeCategoryIds(body: Record<string, unknown>) {
  if (Array.isArray(body.categoryIds)) {
    return body.categoryIds
      .map((categoryId) => Number(categoryId))
      .filter((categoryId) => Number.isInteger(categoryId));
  }

  return body.categoryId ? [Number(body.categoryId)] : [];
}

function normalizeTaskData(body: Record<string, unknown>) {
  const frequency = String(body.frequency || "daily");
  const categoryIds = normalizeCategoryIds(body);

  return {
    name: String(body.name || "").trim(),
    taskType: String(body.taskType || "deep_verify"),
    frequency,
    timeOfDay: String(body.timeOfDay || "02:00"),
    dayOfWeek: frequency === "weekly" ? Number(body.dayOfWeek ?? 1) : null,
    dayOfMonth: frequency === "monthly" || frequency === "quarterly" ? Number(body.dayOfMonth ?? 1) : null,
    enabled: Boolean(body.enabled),
    deepMode: Boolean(body.deepMode),
    maxPages: Math.max(1, Math.min(24, Number(body.maxPages) || 12)),
    categoryIds,
    categoryId: categoryIds.length === 1 ? categoryIds[0] : null,
    notes: body.notes ? String(body.notes) : null,
  };
}

async function ensureDefaultTasks() {
  for (const task of DEFAULT_TASKS) {
    const existing = await prisma.adminScheduledTask.findFirst({
      where: { taskType: task.taskType },
    });

    if (!existing) {
      await prisma.adminScheduledTask.create({
        data: {
          ...task,
          nextRunAt: getNextRunDate(task),
        },
      });
    }
  }
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await ensureDefaultTasks();

    const [tasks, categories] = await Promise.all([
      prisma.adminScheduledTask.findMany({
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ taskType: "asc" }, { name: "asc" }],
      }),
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ tasks, categories });
  } catch (error) {
    console.error("Admin scheduler GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const data = normalizeTaskData(body);

    if (!data.name) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const task = await prisma.adminScheduledTask.update({
      where: { id },
      data: {
        ...data,
        nextRunAt: data.enabled ? getNextRunDate(data) : null,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Admin scheduler PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const data = normalizeTaskData(body);

    if (!data.name) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const task = await prisma.adminScheduledTask.create({
      data: {
        ...data,
        nextRunAt: data.enabled ? getNextRunDate(data) : null,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Admin scheduler POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    await prisma.adminScheduledTask.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin scheduler DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
