/**
 * GraphAlgorithms - клас з алгоритмами для роботи з графами
 */
export class GraphAlgorithms {
  constructor(cy, isDirected = true) {
    this.cy = cy;
    this.isDirected = isDirected;
  }

  /**
   * Алгоритм Пріма для знаходження мінімального остовного дерева
   */
  calculatePrimMST() {
    const nodes = this.cy.nodes();
    if (nodes.length === 0) return { error: "Graph is empty." };

    const edges = this.cy.edges().map((edge) => ({
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

  /**
   * Алгоритм Дейкстри для знаходження найкоротшого шляху
   */
  findShortestPath(source, target) {
    const nodes = this.cy.nodes().map(node => node.id());
    const edges = this.cy.edges().map(edge => ({
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

  /**
   * Знаходження мінімального зваженого шляху для 4 вершин
   */
  findMinWeightedPathForFourVertices() {
    const nodes = this.cy.nodes().map(node => node.id());
    if (nodes.length < 4) return "Not enough vertices (minimum 4 required).";

    const edges = this.cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
      weight: parseFloat(edge.data('weight')) || Infinity,
    }));

    const graph = {};
    nodes.forEach(node => graph[node] = []);
    edges.forEach(edge => {
      graph[edge.source].push({ target: edge.target, weight: edge.weight });
      if (!this.isDirected) {
        graph[edge.target].push({ target: edge.source, weight: edge.weight });
      }
    });

    let minWeight = Infinity;
    let bestPath = null;

    const combinations = this.getCombinations(nodes, 4);

    for (const combination of combinations) {
      const [u, v, x, y] = combination;

      const weightUV = this.findShortestPathWeight(graph, u, v);
      const weightVX = this.findShortestPathWeight(graph, v, x);
      const weightXY = this.findShortestPathWeight(graph, x, y);

      if (weightUV !== Infinity && weightVX !== Infinity && weightXY !== Infinity) {
        const totalWeight = weightUV + weightVX + weightXY;

        if (totalWeight < minWeight) {
          minWeight = totalWeight;
          bestPath = [u, v, x, y];
        }
      }
    }

    if (!bestPath) {
      return { error: "No valid path found.", nodes: [], edges: [] };
    }

    const pathEdges = bestPath.slice(1).map((node, i) => ({
      source: bestPath[i],
      target: node
    }));

    return {
      nodes: bestPath,
      edges: pathEdges,
      weight: minWeight
    };
  }

  /**
   * Допоміжна функція для знаходження ваги найкоротшого шляху
   */
  findShortestPathWeight(graph, start, target) {
    const visited = new Set();
    let minWeight = Infinity;

    const dfs = (node, weight) => {
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
    };

    dfs(start, 0);
    return minWeight;
  }

  /**
   * Генерація всіх остовних дерев
   */
  generateAllSpanningTrees() {
    const nodes = this.cy.nodes().map(node => node.id());
    const edges = this.cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
      weight: parseFloat(edge.data('weight')) || 0,
    }));

    const subsets = this.getCombinations(edges, nodes.length - 1);
    const spanningTrees = subsets.filter(subset => this.isSpanningTree(nodes, subset));
    return spanningTrees;
  }

  /**
   * Перевірка чи є набір ребер остовним деревом
   */
  isSpanningTree(nodes, edges) {
    if (edges.length !== nodes.length - 1) return false;

    const graph = {};
    nodes.forEach(node => (graph[node] = []));
    edges.forEach(edge => {
      graph[edge.source].push(edge.target);
      graph[edge.target].push(edge.source);
    });

    const visited = new Set();
    const dfs = (node) => {
      if (visited.has(node)) return;
      visited.add(node);
      graph[node].forEach(neighbor => dfs(neighbor));
    };
    dfs(nodes[0]);

    return visited.size === nodes.length;
  }

  /**
   * Знаходження Ейлерових шляхів та циклів
   */
  findEulerTrailAndCircuit() {
    const nodes = this.cy.nodes();
    const edges = this.cy.edges();

    if (nodes.length === 0 || edges.length === 0) {
      return "Graph is empty.";
    }

    const connectedComponents = this.cy.elements().components();
    if (connectedComponents.length > 1) {
      return "Graph is not connected.";
    }

    if (this.isDirected) {
      const inDegree = {};
      const outDegree = {};

      nodes.forEach(node => {
        const id = node.id();
        inDegree[id] = 0;
        outDegree[id] = 0;
      });

      edges.forEach(edge => {
        const source = edge.data('source');
        const target = edge.data('target');
        outDegree[source]++;
        inDegree[target]++;
      });

      let startNodes = 0, endNodes = 0;

      nodes.forEach(node => {
        const id = node.id();
        if (outDegree[id] - inDegree[id] === 1) {
          startNodes++;
        } else if (inDegree[id] - outDegree[id] === 1) {
          endNodes++;
        } else if (Math.abs(inDegree[id] - outDegree[id]) > 1) {
          return "No Euler Trail or Circuit exists.";
        }
      });

      if (startNodes === 0 && endNodes === 0) {
        return "Euler Circuit exists (directed graph).";
      } else if (startNodes === 1 && endNodes === 1) {
        return "Euler Trail exists (directed graph).";
      } else {
        return "No Euler Trail or Circuit exists (directed graph).";
      }
    } else {
      const degreeCount = {};

      nodes.forEach(node => {
        degreeCount[node.id()] = 0;
      });

      edges.forEach(edge => {
        const source = edge.data('source');
        const target = edge.data('target');
        degreeCount[source]++;
        degreeCount[target]++;
      });

      const oddVertices = Object.keys(degreeCount).filter(node => degreeCount[node] % 2 !== 0);

      if (oddVertices.length === 0) {
        return "Euler Circuit exists (all degrees are even).";
      } else if (oddVertices.length === 2) {
        return `Euler Trail exists (odd degree vertices: ${oddVertices.join(', ')}).`;
      } else {
        return "No Euler Trail or Circuit exists (more than 2 vertices with odd degree).";
      }
    }
  }

  /**
   * Знаходження Гамільтонових циклів
   */
  findHamiltonianCycles() {
    const nodes = this.cy.nodes().map(node => node.id());
    const edges = this.cy.edges().map(edge => ({
      source: edge.data('source'),
      target: edge.data('target'),
    }));

    const paths = [];
    const hamiltonian = (current, visited, path) => {
      if (path.length === nodes.length) {
        if (
          this.isDirected
            ? edges.some(edge => edge.source === current && edge.target === path[0])
            : edges.some(edge =>
              (edge.source === current && edge.target === path[0]) ||
              (edge.target === current && edge.source === path[0])
            )
        ) {
          paths.push([...path, path[0]]);
        }
        return;
      }

      nodes.forEach(next => {
        if (
          !visited.has(next) &&
          (this.isDirected
            ? edges.some(edge => edge.source === current && edge.target === next)
            : edges.some(edge =>
              (edge.source === current && edge.target === next) ||
              (edge.target === current && edge.source === next))
          )
        ) {
          visited.add(next);
          path.push(next);
          hamiltonian(next, visited, path);
          path.pop();
          visited.delete(next);
        }
      });
    };

    nodes.forEach(start => {
      const visited = new Set([start]);
      hamiltonian(start, visited, [start]);
    });

    return paths.length
      ? `${paths.map(path => path.join(' -> ')).join('<br>')}`
      : "No Hamiltonian Cycles found.";
  }

  /**
   * Генерація комбінацій
   */
  getCombinations(array, size) {
    const result = [];
    const helper = (start, combo) => {
      if (combo.length === size) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < array.length; i++) {
        combo.push(array[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };
    helper(0, []);
    return result;
  }

  /**
   * Оновлення типу графа
   */
  setDirected(isDirected) {
    this.isDirected = isDirected;
  }
}
