import path from "node:path";
import fs from "node:fs";

export function getProjectRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 4; i++) {
    if (
      fs.existsSync(path.resolve(curr, "backend")) &&
      fs.existsSync(path.resolve(curr, "frontend")) &&
      fs.existsSync(path.resolve(curr, "aai"))
    ) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd();
}

export function getStorageDir(): string {
  const root = getProjectRoot();
  const dir = path.resolve(root, "storage");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.resolve(dir, "uploads"), { recursive: true });
  fs.mkdirSync(path.resolve(dir, "work"), { recursive: true });
  fs.mkdirSync(path.resolve(dir, "clips"), { recursive: true });
  fs.mkdirSync(path.resolve(dir, "exports"), { recursive: true });
  return dir;
}

export function getPublicExportsDir(): string {
  const root = getProjectRoot();
  const dir = path.resolve(root, "frontend", "public", "exports");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
