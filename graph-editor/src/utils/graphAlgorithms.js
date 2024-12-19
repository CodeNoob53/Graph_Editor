// src/utils/graphAlgorithms.js

// Знайти MST за алгоритмом Пріма
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
  
  
  // Знайти найкоротший шлях (Dijkstra)
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
  
  
  // Пошук мінімальної зваженої структури для 4 вершин
  export function findMinWeightedPathForFourVertices(cy) {
    const nodes = cy.nodes();
    if (nodes.length < 4) return "Not enough vertices (minimum 4 required).";
  
    const edges = cy.edges().map(edge => {
      const weight = parseFloat(edge.data('weight'));
      return {
        source: edge.data('source'),
        target: edge.data('target'),
        weight: isNaN(weight) ? Infinity : weight
      };
    });
  
    const combinations = getCombinations(nodes.map(n => n.id()), 4);
  
    let minSum = Infinity;
    let minPath = null;
  
    for (const combination of combinations) {
      const subGraph = extractSubGraph(combination, edges);
      const mstSum = calculateMSTSum(subGraph);
      if (mstSum < minSum) {
        minSum = mstSum;
        minPath = subGraph;
      }
    }
  
    if (!minPath) return "No valid path found.";
    return `Minimum Sum: ${minSum}<br>Path: ${JSON.stringify(minPath, null, 2)}`;
  }
  
  // Генеруємо всі каркасні дерева
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
  
  
  // Допоміжні функції
  function getCombinations(array, size) {
    const result = [];
    (function helper(start, combo) {
      if (combo.length === size) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < array.length; i++) {
        combo.push(array[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    })(0, []);
    return result;
  }
  
  function extractSubGraph(nodes, edges) {
    return edges.filter(edge =>
      nodes.includes(edge.source) && nodes.includes(edge.target) && edge.weight !== Infinity
    );
  }
  
  function calculateMSTSum(subGraph) {
    if (subGraph.length < 3) return Infinity;
  
    const graph = {};
    subGraph.forEach(edge => {
      if (!graph[edge.source]) graph[edge.source] = [];
      if (!graph[edge.target]) graph[edge.target] = [];
      graph[edge.source].push({ node: edge.target, weight: edge.weight });
      graph[edge.target].push({ node: edge.source, weight: edge.weight });
    });
  
    const visited = new Set();
    const nodes = Object.keys(graph);
    const minHeap = [{ node: nodes[0], weight: 0 }];
    let sum = 0;
  
    while (minHeap.length > 0) {
      minHeap.sort((a, b) => a.weight - b.weight);
      const current = minHeap.shift();
  
      if (visited.has(current.node)) continue;
      visited.add(current.node);
      sum += current.weight;
  
      if (graph[current.node]) {
        graph[current.node].forEach(neighbor => {
          if (!visited.has(neighbor.node)) {
            minHeap.push({ node: neighbor.node, weight: neighbor.weight });
          }
        });
      }
    }
  
    return visited.size === nodes.length ? sum : Infinity;
  }
  
  function isSpanningTree(nodes, edges) {
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
  