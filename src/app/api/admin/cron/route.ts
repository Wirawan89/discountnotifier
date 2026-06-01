import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const START_MARKER = "# DiscountNotifier admin scheduler start";
const END_MARKER = "# DiscountNotifier admin scheduler end";

function clampInterval(value: unknown) {
  const interval = Number(value) || 15;
  return [5, 10, 15, 30, 60].includes(interval) ? interval : 15;
}

function cronExpression(intervalMinutes: number) {
  return intervalMinutes === 60 ? "0 * * * *" : `*/${intervalMinutes} * * * *`;
}

function managedBlock(intervalMinutes: number) {
  const projectDir = process.cwd();
  const logPath = path.join(projectDir, "logs", "admin-scheduler.log");

  return [
    START_MARKER,
    `${cronExpression(intervalMinutes)} cd "${projectDir}" && npm run admin:run-due >> "${logPath}" 2>&1`,
    END_MARKER,
  ].join("\n");
}

async function readCrontab() {
  try {
    const { stdout } = await execFileAsync("crontab", ["-l"]);
    return stdout;
  } catch (error: any) {
    if (error?.code === 1) return "";
    throw error;
  }
}

function withoutManagedBlock(crontab: string) {
  const pattern = new RegExp(
    `${START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`,
    "g"
  );

  return crontab.replace(pattern, "").trim();
}

function findManagedLine(crontab: string) {
  const start = crontab.indexOf(START_MARKER);
  const end = crontab.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end <= start) return null;

  return crontab
    .slice(start, end)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#")) || null;
}

async function writeCrontab(content: string) {
  const child = execFile("crontab", ["-"], (error) => {
    if (error) {
      console.error("Failed to write crontab:", error);
    }
  });

  child.stdin?.write(`${content.trim()}\n`);
  child.stdin?.end();

  await new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`crontab exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const crontab = await readCrontab();
    const line = findManagedLine(crontab);

    return NextResponse.json({
      installed: Boolean(line),
      line,
      defaultIntervalMinutes: 15,
    });
  } catch (error) {
    console.error("Admin cron GET error:", error);
    return NextResponse.json({ error: "Failed to read cron status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const intervalMinutes = clampInterval(body.intervalMinutes);
    const crontab = await readCrontab();
    const base = withoutManagedBlock(crontab);
    const next = [base, managedBlock(intervalMinutes)].filter(Boolean).join("\n\n");

    await writeCrontab(next);

    return NextResponse.json({
      installed: true,
      intervalMinutes,
      line: findManagedLine(next),
    });
  } catch (error) {
    console.error("Admin cron POST error:", error);
    return NextResponse.json({ error: "Failed to install cron runner" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const crontab = await readCrontab();
    const next = withoutManagedBlock(crontab);
    await writeCrontab(next);

    return NextResponse.json({ installed: false });
  } catch (error) {
    console.error("Admin cron DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove cron runner" }, { status: 500 });
  }
}
