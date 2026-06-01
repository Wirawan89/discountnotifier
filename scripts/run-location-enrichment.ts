import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
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

async function updateTask(taskId: number | null, status: string, message: string) {
  if (!taskId) return;

  await prisma.adminScheduledTask.update({
    where: { id: taskId },
    data: {
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastRunMessage: message,
    },
  });
}

async function main() {
  const category = getArg("category");
  const categories = (getArg("categories") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const taskId = Number(getArg("taskId") || "") || null;
  const maxChecked = Number(getArg("maxChecked") || 18);
  const maxLocations = Number(getArg("maxLocations") || 60);
  const limit = Number(getArg("limit") || 250);
  const dryRun = hasFlag("dry-run");

  await updateTask(taskId, "running", "Location enrichment started.");

  try {
    const targetCategories = categories.length > 0 ? categories : category ? [category] : [undefined];

    for (const targetCategory of targetCategories) {
      const enrichmentArgs = [
        "tsx",
        "scripts/enrich-online-store-locations.ts",
        "--discountState=all",
        `--limit=${limit}`,
        `--maxChecked=${maxChecked}`,
        `--maxLocations=${maxLocations}`,
      ];

      if (targetCategory) enrichmentArgs.push(`--category=${targetCategory}`);
      if (dryRun) enrichmentArgs.push("--dry-run");

      run("npx", enrichmentArgs);

      if (!dryRun) {
        const verifyArgs = [
          "tsx",
          "scripts/reverify-current-offers.ts",
          "--create-missing",
        ];

        if (targetCategory) verifyArgs.push(`--category=${targetCategory}`);

        run("npx", verifyArgs);
      }
    }

    await updateTask(
      taskId,
      "success",
      `Location enrichment${targetCategories[0] ? ` for ${targetCategories.join(", ")}` : ""} completed.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown location enrichment error";
    await updateTask(taskId, "failed", message);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Location enrichment failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
