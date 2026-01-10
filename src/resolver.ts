import { join, dirname, resolve, relative, sep } from "node:path";

export function resolveImport(
  uri: string,
  filePath: string,
  projectName: string,
  rootPath: string,
): string | null {
  // 1️⃣ Ignore SDK imports
  if (uri.startsWith("dart:")) return null;

  // 2️⃣ Handle package imports
  if (uri.startsWith("package:")) {
    const [, pkg, rest] = uri.match(/^package:([^/]+)\/(.+)$/) ?? [];
    if (!pkg || pkg !== projectName) return null;

    return join("lib", rest!);
  }

  // 3️⃣ Handle relative imports
  if (uri.startsWith(".") || uri.startsWith("/")) {
    const resolved = resolve(dirname(filePath), uri);

    // Must stay inside project root
    if (!resolved.startsWith(rootPath + sep)) return null;

    const rel = relative(rootPath, resolved).replaceAll("\\", "/");
    return rel.startsWith("lib/") ? rel : null;
  }

  return null;
}
