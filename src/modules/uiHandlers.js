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
      const result = calculatePrimMST(this.cy, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
      } else {
        highlightEdges(this.cy, result.mst);
        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ Мінімальне остовне дерево (MST)</h3>
            <p><strong>Загальна вага:</strong> ${result.totalWeight}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Кількість вершин:</strong> ${result.nodeCount}</p>
          </div>
        `;
      }
    });

    const findPathButton = document.getElementById('findPath');
    findPathButton?.addEventListener('click', () => {
      const source = document.getElementById('sourceNode').value.trim();
      const target = document.getElementById('targetNode').value.trim();

      if (!source || !target) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ffa94d;">
            <h3>⚠️ Введіть вершини</h3>
            <p>Будь ласка, введіть вихідну та цільову вершини</p>
          </div>
        `;
        return;
      }

      const result = findShortestPath(this.cy, source, target, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
      } else {
        highlightPath(this.cy, result.path);
        const arrow = this.state.isDirected ? '→' : '—';
        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ Найкоротший шлях (${result.graphType})</h3>
            <p><strong>Від:</strong> ${source} <strong>До:</strong> ${target}</p>
            <p><strong>Відстань:</strong> ${result.distance}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Шлях:</strong> ${result.path.join(` ${arrow} `)}</p>
          </div>
        `;
      }
    });

    const findMinPathButton = document.getElementById('findMinPath');
    findMinPathButton?.addEventListener('click', () => {
      const result = findMinWeightedPathForFourVertices(this.cy, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.checkedCombinations ? `<p><small>Перевірено комбінацій: ${result.checkedCombinations}</small></p>` : ''}
          </div>
        `;
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
      const result = generateAllSpanningTrees(this.cy, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.checkedCombinations ? `<p><small>Перевірено комбінацій: ${result.checkedCombinations}</small></p>` : ''}
          </div>
        `;
      } else {
        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ Всі остовні дерева</h3>
            <p><strong>Знайдено дерев:</strong> ${result.count}</p>
            <p><strong>Вершин в графі:</strong> ${result.nodeCount}</p>
            <p><strong>Ребер в кожному дереві:</strong> ${result.edgesPerTree}</p>
            <p><small>Перевірено комбінацій: ${result.totalCombinations}</small></p>
          </div>
        `;
      }
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
