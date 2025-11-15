import { getCombinations } from '../utils/combinatorics.js';

export function generateAllSpanningTrees(cy) {
  const nodes = cy.nodes().map(node => node.id());
  const edges = cy.edges().map(edge => ({
    source: edge.data('source'),
    target: edge.data('target'),
    weight: parseFloat(edge.data('weight')) || 0,
  }));

  const subsets = getCombinations(edges, nodes.length - 1);
  const spanningTrees = subsets.filter(subset => isSpanningTree(nodes, subset));
  return spanningTrees;
}

export function isSpanningTree(nodes, edges) {
  if (edges.length !== nodes.length - 1) return false;

  const graph = {};
  nodes.forEach(node => (graph[node] = []));
  edges.forEach(edge => {
    graph[edge.source].push(edge.target);
    graph[edge.target].push(edge.source);
  });

  const visited = new Set();
  (function dfs(node) {
    if (visited.has(node)) return;
    visited.add(node);
    graph[node].forEach(neighbor => dfs(neighbor));
  })(nodes[0]);

  return visited.size === nodes.length;
}
