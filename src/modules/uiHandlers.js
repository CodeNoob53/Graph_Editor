import { calculatePrimMST } from '../algorithms/mst.js';
import { findShortestPath } from '../algorithms/shortestPath.js';
import { findMinWeightedPathForFourVertices } from '../algorithms/minWeightedPath.js';
import { generateAllSpanningTrees } from '../algorithms/spanningTrees.js';
import { highlightPath, highlightEdges, highlightNodesAndEdges, clearHighlights } from '../utils/highlight.js';

export function setupUIHandlers(cy, state, historyManager, eh) {
  function setMode(mode) {
    state.activeMode = mode;
    state.selectedNodeId = null;

    if (mode !== "edge") {
      eh.disableDrawMode();
    }
  }

  function updateEdgeStyle() {
    cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', state.isDirected ? 'triangle' : 'none');
    });
  }

  const addNodeButton = document.getElementById("addNode");
  addNodeButton?.addEventListener("click", () => setMode("node"));

  const addEdgeButton = document.getElementById('addEdge');
  addEdgeButton?.addEventListener('click', () => {
    if (state.activeMode !== "edge") {
      setMode("edge");
      eh.enableDrawMode();
    } else {
      setMode("arrow");
      eh.disableDrawMode();
    }
  });

  const mouseArrowButton = document.getElementById("mouseArrow");
  mouseArrowButton?.addEventListener("click", () => setMode("arrow"));

  const clearGraphButton = document.getElementById("clearGraph");
  clearGraphButton?.addEventListener("click", () => {
    cy.elements().remove();
    state.nodeCount = 0;
    historyManager.saveHistory();
  });

  const directedCheckbox = document.getElementById("directedGraph");
  directedCheckbox?.addEventListener("change", () => {
    state.isDirected = directedCheckbox.checked;
    updateEdgeStyle();
    console.log("Graph directed:", state.isDirected);
  });

  const undoButton = document.getElementById('undo');
  undoButton?.addEventListener('click', () => {
    historyManager.undo();
  });

  const redoButton = document.getElementById('redo');
  redoButton?.addEventListener('click', () => {
    historyManager.redo();
  });

  const exportButton = document.getElementById('exportGraph');
  exportButton?.addEventListener('click', () => {
    const graphData = cy.json();
    const dataStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  const importButton = document.getElementById('importGraph');
  importButton?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const graphData = JSON.parse(event.target.result);
          cy.json(graphData);
          historyManager.saveHistory();
        } catch (error) {
          console.error('Error importing graph:', error);
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  });

  const getInfoButton = document.getElementById('getInfo');
  getInfoButton?.addEventListener('click', () => {
    const nodes = cy.nodes();
    const edges = cy.edges();
    const info = `
      <h3>Graph Information</h3>
      <p>Nodes: ${nodes.length}</p>
      <p>Edges: ${edges.length}</p>
      <p>Type: ${state.isDirected ? 'Directed' : 'Undirected'}</p>
    `;
    document.getElementById('info').innerHTML = info;
  });

  const calculateMSTButton = document.getElementById('calculateMST');
  calculateMSTButton?.addEventListener('click', () => {
    const result = calculatePrimMST(cy);
    if (result.error) {
      document.getElementById('info').innerHTML = `<p>Error: ${result.error}</p>`;
    } else {
      highlightEdges(cy, result.mst);
      const totalWeight = result.mst.reduce((sum, edge) => sum + edge.weight, 0);
      document.getElementById('info').innerHTML = `
        <h3>Minimum Spanning Tree</h3>
        <p>Total Weight: ${totalWeight}</p>
        <p>Edges: ${result.mst.length}</p>
      `;
    }
  });

  const findPathButton = document.getElementById('findPath');
  findPathButton?.addEventListener('click', () => {
    const source = document.getElementById('sourceNode').value;
    const target = document.getElementById('targetNode').value;

    if (!source || !target) {
      alert('Please enter both source and target nodes');
      return;
    }

    const result = findShortestPath(cy, source, target);
    if (result.distance === Infinity) {
      document.getElementById('info').innerHTML = `<p>No path found between ${source} and ${target}</p>`;
    } else {
      highlightPath(cy, result.path);
      document.getElementById('info').innerHTML = `
        <h3>Shortest Path</h3>
        <p>From: ${source} To: ${target}</p>
        <p>Distance: ${result.distance}</p>
        <p>Path: ${result.path.join(' → ')}</p>
      `;
    }
  });

  const findMinPathButton = document.getElementById('findMinPath');
  findMinPathButton?.addEventListener('click', () => {
    const result = findMinWeightedPathForFourVertices(cy, state.isDirected);
    if (typeof result === 'string') {
      document.getElementById('info').innerHTML = `<p>${result}</p>`;
    } else {
      highlightNodesAndEdges(cy, result.bestPath,
        result.bestPath.slice(1).map((node, i) => ({
          source: result.bestPath[i],
          target: node
        }))
      );
      document.getElementById('info').innerHTML = result.formattedMessage;
      if (window.MathJax) {
        window.MathJax.typeset();
      }
    }
  });

  const listSpanningTreesButton = document.getElementById('listSpanningTrees');
  listSpanningTreesButton?.addEventListener('click', () => {
    const trees = generateAllSpanningTrees(cy);
    document.getElementById('info').innerHTML = `
      <h3>All Spanning Trees</h3>
      <p>Total count: ${trees.length}</p>
    `;
  });

  const spoilerToggle = document.getElementById('spoilerToggle');
  const pathSpoilerContent = document.getElementById('pathSpoilerContent');
  spoilerToggle?.addEventListener('click', () => {
    if (pathSpoilerContent.style.display === 'none' || !pathSpoilerContent.style.display) {
      pathSpoilerContent.style.display = 'block';
    } else {
      pathSpoilerContent.style.display = 'none';
    }
  });

  const rpClose = document.querySelector('.rpClose');
  const rightPanel = document.getElementById('rightPanel');
  rpClose?.addEventListener('click', () => {
    if (rightPanel.style.display === 'none') {
      rightPanel.style.display = 'block';
    } else {
      rightPanel.style.display = 'none';
    }
  });
}
