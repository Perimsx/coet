import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const isWindows = process.platform === "win32";
const rootDirectory = process.cwd();
const args = process.argv.slice(2);
const mode = args.includes("--prod") ? "prod" : "dev";
const skipPull = args.includes("--no-pull");
const skipStart = args.includes("--no-start");
const branch = valueAfter("--branch") || process.env.BRANCH || "main";

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function commandName(command) {
  return isWindows && ["pnpm", "corepack"].includes(command) ? `${command}.cmd` : command;
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(commandName(command), commandArgs, {
    cwd: rootDirectory,
    stdio: "inherit",
    shell: isWindows,
    ...options,
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(`${command} ${commandArgs.join(" ")} 执行失败`);
  }
}

function output(command, commandArgs) {
  const result = spawnSync(commandName(command), commandArgs, {
    cwd: rootDirectory,
    encoding: "utf8",
    shell: isWindows,
  });
  if (result.error || result.status !== 0) return "";
  return result.stdout.trim();
}

function assertCommand(command, commandArgs, message) {
  const result = spawnSync(commandName(command), commandArgs, {
    cwd: rootDirectory,
    stdio: "ignore",
    shell: isWindows,
  });
  if (result.error || result.status !== 0) throw new Error(message);
}

function syncRepository() {
  const gitRoot = output("git", ["rev-parse", "--show-toplevel"]);
  if (!gitRoot) throw new Error("当前目录不是 Git 仓库，无法自动拉取；请先 git clone 后再运行此脚本");

  const dirty = output("git", ["status", "--porcelain"]);
  if (dirty) {
    throw new Error("工作区存在未提交修改，已停止拉取以避免覆盖本地文件；提交、暂存或使用 --no-pull");
  }

  const remote = output("git", ["remote", "get-url", "origin"]);
  if (!remote) throw new Error("未配置 origin 远程仓库");

  console.log(`[bootstrap] 拉取 origin/${branch}`);
  run("git", ["fetch", "origin", branch]);
  const currentBranch = output("git", ["branch", "--show-current"]);
  if (currentBranch !== branch) {
    const checkout = spawnSync(commandName("git"), ["checkout", branch], {
      cwd: rootDirectory,
      stdio: "ignore",
      shell: isWindows,
    });
    if (checkout.error || checkout.status !== 0) {
      run("git", ["checkout", "-b", branch, "--track", `origin/${branch}`]);
    }
  }
  run("git", ["merge", "--ff-only", `origin/${branch}`]);
}

function runPackageScript(script) {
  run("pnpm", ["run", script]);
}

try {
  const nodeVersion = output("node", ["--version"]);
  const nodeMajor = Number.parseInt(nodeVersion.replace(/^v/, "").split(".")[0], 10);
  if (!nodeVersion || !Number.isFinite(nodeMajor) || nodeMajor < 20) {
    throw new Error("未找到 Node.js 20+");
  }
  assertCommand("git", ["--version"], "未找到 Git");
  const goVersion = output("go", ["version"]);
  const goMatch = goVersion.match(/go(\d+)\.(\d+)/);
  if (!goMatch || Number(goMatch[1]) < 1 || Number(goMatch[2]) < 26) {
    throw new Error("未找到 Go 1.26+");
  }
  if (!existsSync(resolve(rootDirectory, "package.json"))) {
    throw new Error("当前目录缺少 package.json");
  }

  if (!skipPull) syncRepository();
  run("node", ["scripts/setup.mjs"]);

  if (mode === "prod") runPackageScript("build:standalone");
  console.log(`[bootstrap] ${mode === "prod" ? "生产构建" : "开发环境"}准备完成`);

  if (!skipStart) {
    run("node", ["scripts/run-all.mjs", ...(mode === "prod" ? ["--prod"] : [])]);
  }
} catch (error) {
  console.error(`[bootstrap] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
