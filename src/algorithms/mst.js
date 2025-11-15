export function calculatePrimMST(cy) {
  const nodes = cy.nodes();
  if (nodes.length === 0) return { error: "Graph is empty." };

  const edges = cy.edges().map((edge) => ({
    source: edge.data("source"),
    target: edge.data("target"),
    weight: parseFloat(edge.data("weight")) || Infinity,
  }));

  const graph = {};
  nodes.forEach((node) => { graph[node.id()] = []; });

  edges.forEach((edge) => {
    graph[edge.source].push({ node: edge.target, weight: edge.weight });
    graph[edge.target].push({ node: edge.source, weight: edge.weight });
  });

  const mst = [];
  const visited = new Set();
  const minHeap = [{ node: nodes[0].id(), weight: 0, parent: null }];

  while (minHeap.length > 0) {
    minHeap.sort((a, b) => a.weight - b.weight);
    const current = minHeap.shift();

    if (visited.has(current.node)) continue;
    visited.add(current.node);

    if (current.parent !== null) {
      mst.push({
        source: current.parent,
        target: current.node,
        weight: current.weight,
      });
    }

    graph[current.node].forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        minHeap.push({
          node: neighbor.node,
          weight: neighbor.weight,
          parent: current.node,
        });
      }
    });
  }

  if (visited.size !== nodes.length) {
    return { error: "Graph is disconnected." };
  }

  return { mst };
}
