import { spawn } from "node:child_process";

let suppressTrace = false;

const isWarningStart = (line) =>
  line.includes("Resolve plugin path failed: vue-router/volar/sfc-route-blocks");

const isSuppressedTraceLine = (line) =>
  line.includes("vue-router/volar/sfc-route-blocks") ||
  line.includes("ERR_PACKAGE_PATH_NOT_EXPORTED") ||
  /^\s+at\s/.test(line) ||
  line.trim() === "{}" ||
  line.trim() === "}";

const forwardFiltered = (chunk, writer) => {
  const text = chunk.toString();
  const lines = text.split("\n");
  for (const line of lines) {
    if (isWarningStart(line)) {
      suppressTrace = true;
      continue;
    }

    if (suppressTrace) {
      if (line.trim() === "") {
        suppressTrace = false;
      }
      if (isSuppressedTraceLine(line)) {
        continue;
      }
      suppressTrace = false;
    }

    if (line !== "") {
      writer.write(`${line}\n`);
    }
  }
};

const child = spawn("nuxt", ["typecheck"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

child.stdout.on("data", (chunk) => forwardFiltered(chunk, process.stdout));
child.stderr.on("data", (chunk) => forwardFiltered(chunk, process.stderr));

child.on("close", (code) => {
  process.exit(code ?? 1);
});
