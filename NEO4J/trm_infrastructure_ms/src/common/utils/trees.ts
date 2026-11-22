export interface RelSpec {
  depth: number;
  filter: string;
  pathVar: string;
  isArrayFlags: boolean[];
  parts: string[];
}

export function toRelSpecs(
  relations: string[],
  relMap: Record<string, { filter: string; isArray: boolean }>
): RelSpec[] {
  return relations.map((rel, i) => {
    const entries = rel
      .split('.')
      .map(p => ({ key: p, spec: relMap[p] }))
      .filter(e => !!e.spec);

    const parts = entries.map(e => e.key);
    const filters = entries.map(e => e.spec.filter);
    const flags = entries.map(e => e.spec.isArray);

    return {
      depth: parts.length,
      filter: filters.join(','),
      pathVar: `${parts.join('_')}Seq${i}`,
      isArrayFlags: flags,
      parts: parts
    };
  });
}

export function toExpandTrees(
  alias: string,
  relations: string[],
  relMap: Record<string, { filter: string; isArray: boolean }>
): { cypher: string; params: Record<string, any>; specs: RelSpec[] } {
  const specs = toRelSpecs(relations, relMap);

  const subcalls = specs.map((s, i) => `
    CALL {
      WITH ${alias}
      CALL apoc.path.expandConfig(${alias}, {
        relationshipFilter: $filter${i},
        maxLevel: $depth${i}
      }) YIELD path
      WITH [n IN nodes(path) | n { .* }] AS seq
      RETURN collect(seq) AS ${s.pathVar}
    }
  `).join('\n');

  const params = specs.reduce((acc, s, i) => {
    acc[`filter${i}`] = s.filter;
    acc[`depth${i}`] = s.depth;
    return acc;
  }, {} as Record<string, any>);

  return {
    cypher: subcalls,
    params,
    specs
  };
  
}

export function buildTreeFromSequences(
  rootNode: any,
  specs: RelSpec[],
  record: any
): any {
  const tree: any = { ...rootNode };

  for (const spec of specs) {
    const seqList: any[][] = record.get(spec.pathVar);

    for (const seq of seqList) {
      let cursor = tree;

      for (let depthIndex = 1; depthIndex < seq.length; depthIndex++) {
        const node = seq[depthIndex];
        const propName = spec.parts[depthIndex - 1];
        const isArray = spec.isArrayFlags[depthIndex - 1];

        // if it's the last level, insert the node
        if (depthIndex === seq.length - 1) {
          if (isArray) {
            // array: initialize if it doesn't exist
            cursor[propName] = cursor[propName] ?? [];

            // avoid duplicates by id
            if (!cursor[propName].find((n: any) => n.id === node.id)) {
              cursor[propName].push(node);
            }
          } else {
            // single: simply assign (overwrite)
            cursor[propName] = node;
          }
        } else {
          if (isArray) {
            cursor[propName] = cursor[propName] ?? [];
            let existing = cursor[propName].find((n: any) => n.id === node.id);
            if (!existing) {
              existing = { ...node };
              cursor[propName].push(existing);
            }
            cursor = existing;
          } else {
            cursor[propName] = cursor[propName] ?? { ...node };
            cursor = cursor[propName];
          }
        }
      }
    }
  }

  return tree;
}
