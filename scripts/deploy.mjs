import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const isWindows = process.platform === "win32";
const repositoryDir = path.resolve(
  process.env.CMS_REPOSITORY_DIR || process.cwd(),
);
const stagingDistName = ".next-deploy";
const activeDistName = ".next";
const previousDistName = ".next-previous";
const binaryDirectory = path.join(repositoryDir, "storage", "bin");
const binarySuffix = isWindows ? ".exe" : "";
const activeAPI = path.join(binaryDirectory, `cms-api${binarySuffix}`);
const stagingAPI = path.join(binaryDirectory, `cms-api.next${binarySuffix}`);
const previousAPI = path.join(
  binaryDirectory,
  `cms-api.previous${binarySuffix}`,
);
const webProcessName = process.env.CMS_PM2_WEB_NAME || "xstack-core";
const webPort = process.env.CMS_WEB_PORT || process.env.PORT || "3010";
const skipRestart = parseBoolean(process.env.CMS_DEPLOY_SKIP_RESTART, false);

function parseBoolean(value, fallback) {
  if (value == null || String(value).trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(
    String(value).trim().toLowerCase(),
  );
}

function commandName(command) {
  return isWindows && ["pnpm", "pm2"].includes(command)
    ? `${command}.cmd`
    : command;
}

function run(command, args, options = {}) {
  const executable = commandName(command);
  const result = spawnSync(executable, args, {
    cwd: repositoryDir,
    env: { ...process.env, ...(options.env || {}) },
    stdio: options.capture ? "pipe" : "inherit",
    encoding: options.capture ? "utf8" : undefined,
    shell: isWindows,
  });
  if (result.error || result.status !== 0) {
    const detail = options.capture
      ? `${result.stdout || ""}\n${result.stderr || ""}`.trim()
      : "";
    throw (
      result.error ||
      new Error(
        `${executable} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`,
      )
    );
  }
  return options.capture ? String(result.stdout || "").trim() : "";
}

function commandAvailable(command, args = ["--version"]) {
  try {
    run(command, args, { capture: true });
    return true;
  } catch {
    return false;
  }
}

function replaceArtifact(stagingPath, activePath, previousPath) {
  rmSync(previousPath, { recursive: true, force: true });
  if (existsSync(activePath)) renameSync(activePath, previousPath);
  try {
    renameSync(stagingPath, activePath);
  } catch (error) {
    if (existsSync(previousPath) && !existsSync(activePath)) {
      renameSync(previousPath, activePath);
    }
    throw error;
  }
}

function restoreArtifact(activePath, previousPath) {
  if (!existsSync(previousPath)) return;
  rmSync(activePath, { recursive: true, force: true });
  renameSync(previousPath, activePath);
}

function preserveFiles(fileNames, operation) {
  const snapshots = fileNames.map((fileName) => {
    const filePath = path.join(repositoryDir, fileName);
    return {
      filePath,
      existed: existsSync(filePath),
      content: existsSync(filePath) ? readFileSync(filePath) : null,
    };
  });
  try {
    return operation();
  } finally {
    for (const snapshot of snapshots) {
      if (snapshot.existed && snapshot.content) {
        writeFileSync(snapshot.filePath, snapshot.content);
      } else if (!snapshot.existed) {
        rmSync(snapshot.filePath, { force: true });
      }
    }
  }
}

function pm2ProcessExists(name) {
  try {
    const items = JSON.parse(run("pm2", ["jlist"], { capture: true }) || "[]");
    return Array.isArray(items) && items.some((item) => item?.name === name);
  } catch {
    return false;
  }
}

function restartWeb() {
  const processEnv = { PORT: webPort, HOSTNAME: "127.0.0.1" };
  if (pm2ProcessExists(webProcessName)) {
    run("pm2", ["restart", webProcessName, "--update-env"], {
      env: processEnv,
    });
    return;
  }

  const serverPath = path.join(
    repositoryDir,
    activeDistName,
    "standalone",
    "server.js",
  );
  run(
    "pm2",
    [
      "start",
      serverPath,
      "--name",
      webProcessName,
      "--cwd",
      repositoryDir,
      "--update-env",
    ],
    { env: processEnv },
  );
}

async function waitForHealthy(url, attempts = 30) {
  let lastError = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(2500),
      });
      if (response.status >= 200 && response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`health check failed for ${url}: ${lastError}`);
}

async function main() {
  if (!existsSync(path.join(repositoryDir, "package.json"))) {
    throw new Error(`invalid CMS_REPOSITORY_DIR: ${repositoryDir}`);
  }
  if (!commandAvailable("pnpm") || !commandAvailable("go", ["version"])) {
    throw new Error("pnpm and Go 1.26+ are required for automatic updates");
  }
  if (!skipRestart && !commandAvailable("pm2")) {
    throw new Error(
      "PM2 is required; set CMS_DEPLOY_SKIP_RESTART=true only for build verification",
    );
  }

  console.log(`[deploy] repository: ${repositoryDir}`);
  console.log("[deploy] installing locked dependencies");
  run("pnpm", ["install", "--frozen-lockfile"]);
  run("go", ["-C", "backend", "mod", "download"]);

  rmSync(path.join(repositoryDir, stagingDistName), {
    recursive: true,
    force: true,
  });
  mkdirSync(binaryDirectory, { recursive: true });
  rmSync(stagingAPI, { force: true });

  console.log("[deploy] building staged Next.js and Go artifacts");
  preserveFiles(["tsconfig.json", "next-env.d.ts"], () => {
    run("pnpm", ["run", "build:standalone"], {
      env: { NEXT_DIST_DIR: stagingDistName },
    });
  });
  run("go", ["-C", "backend", "build", "-o", stagingAPI, "./cmd/server"]);

  replaceArtifact(
    path.join(repositoryDir, stagingDistName),
    path.join(repositoryDir, activeDistName),
    path.join(repositoryDir, previousDistName),
  );
  replaceArtifact(stagingAPI, activeAPI, previousAPI);

  if (skipRestart) {
    console.log(
      "[deploy] artifacts promoted; restart skipped by configuration",
    );
    return;
  }

  try {
    console.log(`[deploy] restarting PM2 web process: ${webProcessName}`);
    restartWeb();
    await waitForHealthy(
      process.env.CMS_WEB_HEALTH_URL || `http://127.0.0.1:${webPort}/`,
    );
    run("pm2", ["save"]);
  } catch (error) {
    console.error("[deploy] activation failed; restoring previous artifacts");
    restoreArtifact(
      path.join(repositoryDir, activeDistName),
      path.join(repositoryDir, previousDistName),
    );
    restoreArtifact(activeAPI, previousAPI);
    if (pm2ProcessExists(webProcessName)) {
      run("pm2", ["restart", webProcessName, "--update-env"], {
        env: { PORT: webPort, HOSTNAME: "127.0.0.1" },
      });
    }
    throw error;
  }

  console.log(
    "[deploy] web process is healthy; API restart will be scheduled by the CMS job",
  );
}

main().catch((error) => {
  console.error(
    `[deploy] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
