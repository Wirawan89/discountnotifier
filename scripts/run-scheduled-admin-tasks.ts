import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function run(command: string, args: string[]) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
}

async function taskCategoryNames(task: {
  categoryIds: number[];
  category?: { name: string } | null;
}) {
  if (task.categoryIds.length > 0) {
    return (
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
    ).map((category) => category.name);
  }

  return task.category?.name ? [task.category.name] : [];
}

function runReverifyForCategories(categoryNames: string[], createMissing: boolean) {
  const targets = categoryNames.length > 0 ? categoryNames : [undefined];

  for (const categoryName of targets) {
    const args = ["tsx", "scripts/reverify-current-offers.ts"];
    if (createMissing) args.push("--create-missing");
    if (categoryName) args.push(`--category=${categoryName}`);
    run("npx", args);
  }
}

function runRegionalSeedForCategories(categoryNames: string[]) {
  const supportedCategories = categoryNames.filter((categoryName) =>
    ["Dining & Beverages", "Food & Groceries"].includes(categoryName)
  );

  const targets = supportedCategories.length > 0 ? supportedCategories : ["Dining & Beverages"];

  for (const categoryName of targets) {
    run("npx", ["tsx", "scripts/run-regional-seed.ts", `--category=${categoryName}`]);
  }
}

async function main() {
  const now = new Date();
  const dueTasks = await prisma.adminScheduledTask.findMany({
    where: {
      enabled: true,
      nextRunAt: {
        lte: now,
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      nextRunAt: "asc",
    },
  });

  console.log(`Found ${dueTasks.length} due admin scheduled task(s).`);

  for (const task of dueTasks) {
    try {
      await prisma.adminScheduledTask.update({
        where: { id: task.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: "running",
          lastRunMessage: "Scheduled task started.",
        },
      });

      if (task.taskType === "location_enrichment") {
        const categoryNames = await taskCategoryNames(task);
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
        }

        run("npx", args);
      } else if (task.taskType === "deep_verify") {
        runReverifyForCategories(await taskCategoryNames(task), true);
      } else if (task.taskType === "offers_reverify") {
        runReverifyForCategories(await taskCategoryNames(task), true);
      } else if (task.taskType === "regional_seed") {
        runRegionalSeedForCategories(await taskCategoryNames(task));
      } else {
        await prisma.adminScheduledTask.update({
          where: { id: task.id },
          data: {
            lastRunStatus: "skipped",
            lastRunMessage: `${task.taskType} is not implemented by this runner yet.`,
          },
        });
      }

      await prisma.adminScheduledTask.update({
        where: { id: task.id },
        data: {
          nextRunAt: getNextRunDate(task),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scheduled task error";
      await prisma.adminScheduledTask.update({
        where: { id: task.id },
        data: {
          lastRunStatus: "failed",
          lastRunMessage: message,
          nextRunAt: getNextRunDate(task),
        },
      });
      console.error(`Task ${task.name} failed:`, error);
    }
  }
}

main()
  .catch((error) => {
    console.error("Failed to run scheduled admin tasks:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
