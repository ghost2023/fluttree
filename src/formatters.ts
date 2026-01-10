export function toDot(node: any, edges: string[] = []) {
  if (!node?.children) return edges;

  for (const child of node.children) {
    if (!child?.file) continue;
    edges.push(`"${node.file}" -> "${child.file}";`);
    toDot(child, edges);
  }

  return edges;
}

export function toGraph(node: any, nodes = new Set(), links: any[] = []) {
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

export function toMermaid(node: any, lines: string[] = []) {
  for (const c of node.children ?? []) {
    lines.push(`${node.file} --> ${c.file}`);
    toMermaid(c, lines);
  }
  return lines;
}
