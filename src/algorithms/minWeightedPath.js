import { getCombinations } from '../utils/combinatorics.js';

export function findMinWeightedPathForFourVertices(cy, isDirected) {
  if (!cy || typeof cy.nodes !== "function") {
    return "Error: Graph is not initialized properly.";
  }

  const nodes = cy.nodes().map(node => node.id());
  if (nodes.length < 4) return "Not enough vertices (minimum 4 required).";

  const edges = cy.edges().map(edge => ({
    source: edge.data('source'),
    target: edge.data('target'),
    weight: parseFloat(edge.data('weight')) || Infinity,
  }));

  const graph = {};
  nodes.forEach(node => graph[node] = []);
  edges.forEach(edge => {
    graph[edge.source].push({ target: edge.target, weight: edge.weight });
    if (!isDirected) {
      graph[edge.target].push({ target: edge.source, weight: edge.weight });
    }
  });

  let minWeight = Infinity;
  let bestPath = null;

  const combinations = getCombinations(nodes, 4);

  for (const combination of combinations) {
    const [u, v, x, y] = combination;

    const weightUV = findShortestPathWeight(graph, u, v);
    const weightVX = findShortestPathWeight(graph, v, x);
    const weightXY = findShortestPathWeight(graph, x, y);

    if (weightUV !== Infinity && weightVX !== Infinity && weightXY !== Infinity) {
      const totalWeight = weightUV + weightVX + weightXY;

      if (totalWeight < minWeight) {
        minWeight = totalWeight;
        bestPath = [u, v, x, y];
      }
    }
  }

  function findShortestPathWeight(graph, start, target) {
    const visited = new Set();
    let minWeight = Infinity;

    function dfs(node, weight) {
      if (node === target) {
        minWeight = Math.min(minWeight, weight);
        return;
      }
      visited.add(node);
      for (const neighbor of graph[node]) {
        if (!visited.has(neighbor.target)) {
          dfs(neighbor.target, weight + neighbor.weight);
        }
      }
      visited.delete(node);
    }

    dfs(start, 0);
    return minWeight;
  }

  if (!bestPath) {
    return "No valid path found.";
  }

  const formattedPath = bestPath.map((node, i) =>
    i < bestPath.length - 1
      ? `(${node} \\to ${bestPath[i + 1]})`
      : null
  ).filter(Boolean).join(", ");

  return {
    bestPath,
    minWeight,
    formattedMessage: `
      $\\text{Minimum Weighted Path for 4 Vertices:}$<br>
      $\\text{Path: } \\{ ${formattedPath} \\}$<br>
      $\\text{Total Weight: } ${minWeight}$
    `
  };
}
