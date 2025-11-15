import { calculatePrimMST } from '../algorithms/mst.js';
import { findShortestPath } from '../algorithms/shortestPath.js';
import { findMinWeightedPathForFourVertices } from '../algorithms/minWeightedPath.js';
import { generateAllSpanningTrees } from '../algorithms/spanningTrees.js';
import { highlightPath, highlightEdges, highlightNodesAndEdges, clearHighlights } from '../utils/highlight.js';

export class UIManager {
  constructor(cy, state, historyManager, edgeManager) {
    this.cy = cy;
    this.state = state;
    this.historyManager = historyManager;
    this.edgeManager = edgeManager;

    this.init();
  }

  init() {
    this.setupModeButtons();
    this.setupGraphButtons();
    this.setupHistoryButtons();
    this.setupImportExportButtons();
    this.setupAlgorithmButtons();
    this.setupUIToggleButtons();
  }

  setMode(mode) {
    this.state.activeMode = mode;
    this.state.selectedNodeId = null;

    if (mode !== "edge") {
      this.edgeManager.disableDrawMode();
    }
  }

  updateEdgeStyle() {
    this.cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', this.state.isDirected ? 'triangle' : 'none');
    });
  }

  setupModeButtons() {
    const addNodeButton = document.getElementById("addNode");
    addNodeButton?.addEventListener("click", () => this.setMode("node"));

    const addEdgeButton = document.getElementById('addEdge');
    addEdgeButton?.addEventListener('click', () => {
      if (this.state.activeMode !== "edge") {
        this.setMode("edge");
        this.edgeManager.enableDrawMode();
      } else {
        this.setMode("arrow");
        this.edgeManager.disableDrawMode();
      }
    });

    const mouseArrowButton = document.getElementById("mouseArrow");
    mouseArrowButton?.addEventListener("click", () => this.setMode("arrow"));
  }

  setupGraphButtons() {
    const clearGraphButton = document.getElementById("clearGraph");
    clearGraphButton?.addEventListener("click", () => {
      this.cy.elements().remove();
      this.state.nodeCount = 0;
      this.historyManager.saveHistory();
    });

    const directedCheckbox = document.getElementById("directedGraph");
    directedCheckbox?.addEventListener("change", () => {
      this.state.isDirected = directedCheckbox.checked;
      this.updateEdgeStyle();
    });

    const getInfoButton = document.getElementById('getInfo');
    getInfoButton?.addEventListener('click', () => {
      const nodes = this.cy.nodes();
      const edges = this.cy.edges();
      const info = `
        <h3>Graph Information</h3>
        <p>Nodes: ${nodes.length}</p>
        <p>Edges: ${edges.length}</p>
        <p>Type: ${this.state.isDirected ? 'Directed' : 'Undirected'}</p>
      `;
      document.getElementById('info').innerHTML = info;
    });
  }

  setupHistoryButtons() {
    const undoButton = document.getElementById('undo');
    undoButton?.addEventListener('click', () => {
      this.historyManager.undo();
    });

    const redoButton = document.getElementById('redo');
    redoButton?.addEventListener('click', () => {
      this.historyManager.redo();
    });
  }

  setupImportExportButtons() {
    const exportButton = document.getElementById('exportGraph');
    exportButton?.addEventListener('click', () => {
      const graphData = this.cy.json();
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
            this.cy.json(graphData);
            this.historyManager.saveHistory();
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  setupAlgorithmButtons() {
    const calculateMSTButton = document.getElementById('calculateMST');
    calculateMSTButton?.addEventListener('click', () => {
      const result = calculatePrimMST(this.cy);
      if (result.error) {
        document.getElementById('info').innerHTML = `<p>Error: ${result.error}</p>`;
      } else {
        highlightEdges(this.cy, result.mst);
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

      const result = findShortestPath(this.cy, source, target);
      if (result.distance === Infinity) {
        document.getElementById('info').innerHTML = `<p>No path found between ${source} and ${target}</p>`;
      } else {
        highlightPath(this.cy, result.path);
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
      const result = findMinWeightedPathForFourVertices(this.cy, this.state.isDirected);
      if (typeof result === 'string') {
        document.getElementById('info').innerHTML = `<p>${result}</p>`;
      } else {
        highlightNodesAndEdges(this.cy, result.bestPath,
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
      const trees = generateAllSpanningTrees(this.cy);
      document.getElementById('info').innerHTML = `
        <h3>All Spanning Trees</h3>
        <p>Total count: ${trees.length}</p>
      `;
    });
  }

  setupUIToggleButtons() {
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
}
