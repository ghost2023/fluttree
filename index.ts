import { parseArgs } from "util";
import { join, resolve, extname } from "node:path";
import { DependencyCrawler } from "./src/crawler";
import { toDot, toGraph, toMermaid } from "./src/formatters";

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
    startFile: {
      type: "string",
      default: "lib/main.dart",
      short: "s",
    },
    limit: {
      type: "string",
      default: "10000",
      short: "l",
    },
    debug: {
      type: "boolean",
      default: false,
      short: "d",
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

const crawler = new DependencyCrawler(rootPath, projectName);
if (values.debug) crawler.debug = true;
if (Number.parseInt(values.limit) > 0)
  crawler.limit = Number.parseInt(values.limit);
const res = await crawler.crawl(values.startFile);

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
}`;

  await Bun.write(outFile, dot);
} else if (outfileType === ".mmd") {
  const mermaid = `
graph LR
${toMermaid(res).join("\n")}
`;

  await Bun.write(outFile, mermaid);
}

const visited = crawler.visited;
const unused = allProjectFiles.filter((f) => !visited.has(f));
console.log("left files:");
unused.forEach((f) => console.log("  " + f));
