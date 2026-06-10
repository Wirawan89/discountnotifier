import { spawnSync } from "node:child_process";

type RegionSeedScript = {
  region: string;
  categoryName: string;
  script: string;
};

const SEED_SCRIPTS: RegionSeedScript[] = [
  { region: "NSW", categoryName: "Dining & Beverages", script: "scripts/seed-nsw-dining-beverages.ts" },
  { region: "VIC", categoryName: "Dining & Beverages", script: "scripts/seed-victoria-dining-beverages.ts" },
  { region: "QLD", categoryName: "Dining & Beverages", script: "scripts/seed-queensland-dining-beverages.ts" },
  { region: "WA", categoryName: "Dining & Beverages", script: "scripts/seed-western-australia-dining-beverages.ts" },
  { region: "SA", categoryName: "Dining & Beverages", script: "scripts/seed-south-australia-dining-beverages.ts" },
  { region: "TAS", categoryName: "Dining & Beverages", script: "scripts/seed-tasmania-dining-beverages.ts" },
  { region: "ACT", categoryName: "Dining & Beverages", script: "scripts/seed-canberra-dining-beverages.ts" },
  { region: "NT", categoryName: "Dining & Beverages", script: "scripts/seed-northern-territory-dining-beverages.ts" },
  { region: "NSW", categoryName: "Food & Groceries", script: "scripts/seed-nsw-food-groceries.ts" },
  { region: "AU", categoryName: "Factory Outlets", script: "scripts/seed-australia-factory-outlets.ts" },
];

function argValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseList(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function scriptsForRequest() {
  const categories = parseList(argValue("categories") || argValue("category"));
  const regions = parseList(argValue("regions")).map((region) => region.toUpperCase());

  return SEED_SCRIPTS.filter((entry) => {
    const categoryMatches = categories.length === 0 || categories.includes(entry.categoryName);
    const regionMatches = regions.length === 0 || regions.includes(entry.region);
    return categoryMatches && regionMatches;
  });
}

function runScript(script: string) {
  console.log(`\n$ npx tsx ${script}`);
  const result = spawnSync("npx", ["tsx", script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${script} failed with exit code ${result.status ?? "unknown"}`);
  }
}

async function main() {
  const scripts = scriptsForRequest();

  if (scripts.length === 0) {
    console.log("No regional seed scripts matched the request.");
    return;
  }

  console.log(
    `Running ${scripts.length} regional seed script(s): ${scripts
      .map((entry) => `${entry.categoryName}/${entry.region}`)
      .join(", ")}`
  );

  for (const entry of scripts) {
    runScript(entry.script);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
