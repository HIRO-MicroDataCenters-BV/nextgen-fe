import { spawn } from "node:child_process";

const isSuppressedLine = (line) =>
  line.includes("Sourcemap is likely to be incorrect");

const forwardFiltered = (chunk, writer) => {
  const text = chunk.toString();
  const lines = text.split("\n");
  for (const line of lines) {
    if (line !== "" && !isSuppressedLine(line)) {
      writer.write(`${line}\n`);
    }
  }
};

const child = spawn("nuxt", ["build"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

child.stdout.on("data", (chunk) => forwardFiltered(chunk, process.stdout));
child.stderr.on("data", (chunk) => forwardFiltered(chunk, process.stderr));

child.on("close", (code) => {
  process.exit(code ?? 1);
});
