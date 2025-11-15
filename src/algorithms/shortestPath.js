export function findShortestPath(cy, source, target) {
  const nodes = cy.nodes().map(node => node.id());
  const edges = cy.edges().map(edge => ({
    source: edge.data('source'),
    target: edge.data('target'),
    weight: parseFloat(edge.data('weight')) || Infinity
  }));

  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes);

  nodes.forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[source] = 0;

  while (unvisited.size > 0) {
    let currentNode = null;
    unvisited.forEach(node => {
      if (currentNode === null || distances[node] < distances[currentNode]) {
        currentNode = node;
      }
    });

    if (distances[currentNode] === Infinity) break;
    unvisited.delete(currentNode);

    edges.forEach(edge => {
      if (edge.source === currentNode && unvisited.has(edge.target)) {
        const alt = distances[currentNode] + edge.weight;
        if (alt < distances[edge.target]) {
          distances[edge.target] = alt;
          previous[edge.target] = currentNode;
        }
      } else if (edge.target === currentNode && unvisited.has(edge.source)) {
        const alt = distances[currentNode] + edge.weight;
        if (alt < distances[edge.source]) {
          distances[edge.source] = alt;
          previous[edge.source] = currentNode;
        }
      }
    });
  }

  const path = [];
  let currentNode = target;
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previous[currentNode];
  }

  if (path[0] !== source) {
    return { path: [], distance: Infinity };
  }

  return { path, distance: distances[target] };
}
