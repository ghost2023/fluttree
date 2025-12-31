import { parseArgs } from "util";
import { join, dirname, resolve, extname, relative, sep } from "node:path";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    rootPath: {
      type: "string",
      default: "./",
    },
    output: {
      type: "string",
      default: "graph.json",
      short: "o",
    },
  },
  strict: true,
  allowPositionals: true,
});

const rootPath = resolve(values.rootPath);

const pubspecPath = join(rootPath, "pubspec.yaml");
const pubspecFile = Bun.file(pubspecPath);
const pubspecYaml = Bun.YAML.parse(await pubspecFile.text()) as {
  name: string;
};

const projectName = pubspecYaml.name;

const glob = new Bun.Glob("**/*.dart");
let allProjectFiles = await Array.fromAsync(glob.scan(rootPath));
const visited = new Set<string>();

const importRegex = /^\s*import\s+['"](?<uri>[^'"]+)['"][^;]*;/gm;

const res = await main("lib/main.dart");

const outFile = values.output;

const outfileType = extname(outFile);

if (outfileType === ".json") {
  await Bun.write(outFile, JSON.stringify(toGraph(res), null, 2));
} else if (outfileType === ".dot") {
  const edges = toDot(res);

  const dot = `
digraph FlutterDeps {
  rankdir=LR;
  node [shape=box];
  ${edges.join("\n")}
}
`;

  await Bun.write(outFile, dot);
} else if (outfileType === ".mmd") {
  const mermaid = `
graph LR
${toMermaid(res).join("\n")}
`;

  await Bun.write(outFile, mermaid);
}

const mermaid = `
graph LR
${toMermaid(res).join("\n")}
`;

await Bun.write("graph.mmd", mermaid);

Bun.file("res.json").write(JSON.stringify(res, null, 2));
const unused = allProjectFiles.filter((f) => !visited.has(f));
console.log("left files:");
unused.forEach((f) => console.log("  " + f));

async function main(
  fileRelativePath: string,
  obj = {},
  parents: string[] = [],
): Promise<Record<string, any>> {
  if (parents.includes(fileRelativePath)) return {};

  visited.add(fileRelativePath);
  const otherFiles = await parseFile(fileRelativePath);

  const nextParents = [...parents, fileRelativePath];
  const promises = await Promise.all(
    otherFiles.map((f) => main(f, {}, nextParents)),
  );
  return {
    file: fileRelativePath,
    children: promises,
  };
}

async function parseFile(fileRelativePath: string) {
  const filePath = join(rootPath, fileRelativePath);
  const code = await Bun.file(filePath).text();

  const files: string[] = [];

  for (const match of code.matchAll(importRegex)) {
    const uri = match.groups?.uri;
    if (!uri) continue;

    const resolved = resolveImport(uri, filePath, projectName, rootPath);

    if (resolved) {
      files.push(resolved);
    }
  }

  return files;
}

function resolveImport(
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

function toDot(node: any, edges: string[] = []) {
  if (!node?.children) return edges;

  for (const child of node.children) {
    if (!child?.file) continue;
    edges.push(`"${node.file}" -> "${child.file}";`);
    toDot(child, edges);
  }

  return edges;
}

function toGraph(node: any, nodes = new Set(), links: any[] = []) {
  nodes.add(node.file);

  for (const c of node.children ?? []) {
    links.push({ source: node.file, target: c.file });
    toGraph(c, nodes, links);
  }

  return {
    nodes: [...nodes].map((id) => ({ id })),
    links,
  };
}

function toMermaid(node: any, lines: string[] = []) {
  for (const c of node.children ?? []) {
    lines.push(`${node.file} --> ${c.file}`);
    toMermaid(c, lines);
  }
  return lines;
}
