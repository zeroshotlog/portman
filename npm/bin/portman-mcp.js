#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const arch = os.arch();
const platform = os.platform();

if (platform !== "darwin") {
  console.error(`portman-mcp is macOS only. Current platform: ${platform}`);
  process.exit(1);
}

const archMap = {
  arm64: "portman-mcp-darwin-arm64",
  x64: "portman-mcp-darwin-x64",
};

const binaryName = archMap[arch];
if (!binaryName) {
  console.error(`Unsupported architecture: ${arch}`);
  process.exit(1);
}

const binaryPath = path.join(__dirname, "..", "binaries", binaryName);

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error(`Failed to start portman-mcp: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
