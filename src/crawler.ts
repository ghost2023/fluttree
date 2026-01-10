import { join } from "node:path";
import { resolveImport } from "./resolver";
import { request } from "node:http";

const importRegex = /^\s*import\s+['"](?<uri>[^'"]+)['"][^;]*;/gm;

export interface TreeNode {
  file: string;
  children: TreeNode[];
}

export class DependencyCrawler {
  public visited = new Set<string>();
  public limit = 10000;
  public debug = false;

  constructor(
    private rootPath: string,
    private projectName: string,
  ) { }

  async crawl(
    fileRelativePath: string,
    parents: string[] = [],
    callIndex = 0,
  ): Promise<Record<string, any>> {
    if (
      parents.includes(fileRelativePath) ||
      this.visited.has(fileRelativePath)
    ) {
      return {
        file: fileRelativePath,
        children: [],
      };
    }

    if (callIndex > this.limit) {
      console.error("Reached crawler limit");
      return {};
    }
    callIndex++;

    if (this.debug)
      parents.forEach((p, index) => {
        if (index > 0) {
          console.log(new Array(index).fill("  ").join("") + "└─" + p);
        }
      });

    this.visited.add(fileRelativePath);
    const otherFiles = await this.parseFile(fileRelativePath);

    const nextParents = [...parents, fileRelativePath];
    const promises = await Promise.all(
      otherFiles.map((f) => this.crawl(f, nextParents, callIndex + 1)),
    );

    return {
      file: fileRelativePath,
      children: promises,
    };
  }

  private async parseFile(fileRelativePath: string) {
    const filePath = join(this.rootPath, fileRelativePath);
    const code = await Bun.file(filePath).text();

    const files: string[] = [];

    for (const match of code.matchAll(importRegex)) {
      const uri = match.groups?.uri;
      if (!uri) continue;

      const resolved = resolveImport(
        uri,
        filePath,
        this.projectName,
        this.rootPath,
      );

      if (resolved) {
        files.push(resolved);
      }
    }

    return files;
  }
}
