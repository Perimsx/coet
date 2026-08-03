import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const rootDirectory = process.cwd();
const commandName = (command) =>
  isWindows && ["pnpm", "corepack"].includes(command)
    ? `${command}.cmd`
    : command;

function run(command, args, options = {}) {
  const executable = commandName(command);
  const result = spawnSync(executable, args, {
    cwd: rootDirectory,
    stdio: "inherit",
    shell: isWindows,
    ...options,
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(`${executable} ${args.join(" ")} 执行失败`);
  }
}

function canRun(command, args) {
  const result = spawnSync(commandName(command), args, {
    cwd: rootDirectory,
    stdio: "ignore",
    shell: isWindows,
  });
  return !result.error && result.status === 0;
}

function commandOutput(command, args) {
  const result = spawnSync(commandName(command), args, {
    cwd: rootDirectory,
    encoding: "utf8",
    shell: isWindows,
  });
  if (result.error || result.status !== 0) return "";
  return result.stdout.trim();
}

function requireEnvFile(target, example) {
  if (existsSync(target)) return;
  throw new Error(
    `缺少 ${target}，请先上传该文件（可参考 ${example}），然后重新执行 npm run setup`,
  );
}

try {
  const nodeVersion = commandOutput("node", ["--version"]);
  const nodeMajor = Number.parseInt(
    nodeVersion.replace(/^v/, "").split(".")[0],
    10,
  );
  if (!nodeVersion || !Number.isFinite(nodeMajor) || nodeMajor < 20) {
    throw new Error("未找到 Node.js，请安装 Node.js 20+ 后重试");
  }

  const hasPnpm = canRun("pnpm", ["--version"]);
  const hasCorepack = canRun("corepack", ["--version"]);
  if (!hasPnpm && !hasCorepack) {
    throw new Error("未找到 pnpm 或 corepack，请安装 Node.js 20+ 后重试");
  }

  const goVersion = commandOutput("go", ["version"]);
  const goMatch = goVersion.match(/go(\d+)\.(\d+)/);
  if (!goMatch || Number(goMatch[1]) < 1 || Number(goMatch[2]) < 26) {
    throw new Error("未找到 Go，请安装 Go 1.26+ 后重新执行 npm run setup");
  }

  requireEnvFile(".env", ".env.example");
  requireEnvFile("backend/.env", "backend/.env.example");

  if (hasPnpm) {
    run("pnpm", ["install", "--frozen-lockfile"]);
  } else {
    console.log("[setup] 使用 Corepack 临时执行 pnpm");
    run("corepack", ["pnpm", "install", "--frozen-lockfile"]);
  }

  run("go", ["-C", "backend", "mod", "download"]);

  mkdirSync("storage/db", { recursive: true });
  mkdirSync("storage/logs", { recursive: true });
  console.log(
    "[setup] 环境文件已确认，安装完成：运行 npm run dev:all 启动开发环境",
  );
} catch (error) {
  console.error(
    `[setup] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
