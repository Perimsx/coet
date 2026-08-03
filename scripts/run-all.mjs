import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const mode = process.argv.includes("--prod") ? "prod" : "dev";
const children = new Set();
let shuttingDown = false;

function commandName(command) {
  return isWindows && command === "pnpm" ? `${command}.cmd` : command;
}

function start(name, command, args) {
  const child = spawn(commandName(command), args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: isWindows,
    windowsHide: true,
  });

  children.add(child);
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (!shuttingDown && code !== 0) {
      console.error(`[run-all] ${name} 已退出：code=${code ?? "null"}, signal=${signal ?? "null"}`);
      shutdown(code || 1);
    }
  });
  child.on("error", (error) => {
    console.error(`[run-all] 无法启动 ${name}：${error.message}`);
    shutdown(1);
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 1500).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`[run-all] 启动模式：${mode === "prod" ? "production" : "development"}`);
start("CMS API", "go", ["-C", "backend", "run", "./cmd/server"]);
start("Next.js", "pnpm", [mode === "prod" ? "start" : "dev"]);
