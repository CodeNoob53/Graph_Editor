import './styles.css';
import { initCytoscape } from './config/cytoscapeConfig.js';
import { initEdgeHandles } from './modules/edgeHandles.js';
import { setupEventHandlers } from './modules/eventHandlers.js';
import { setupUIHandlers } from './modules/uiHandlers.js';
import { setupGridManager } from './modules/gridManager.js';
import { setupZoomDisplay } from './modules/zoomDisplay.js';
import { HistoryManager } from './utils/history.js';

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    nodeCount: 0,
    gridSize: 50,
    activeMode: "arrow",
    selectedNodeId: null,
    snapEnabled: true,
    isDirected: true,
    nodeRadius: 30
  };

  const container = document.getElementById('cy');
  if (!container) {
    console.error('Cytoscape container not found!');
    return;
  }

  const cy = initCytoscape(container);

  const historyManager = new HistoryManager(cy);

  const eh = initEdgeHandles(cy, state);

  setupEventHandlers(cy, state, historyManager);

  setupUIHandlers(cy, state, historyManager, eh);

  setupGridManager(cy, state);

  setupZoomDisplay(cy);

  function updateEdgeStyle() {
    cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', state.isDirected ? 'triangle' : 'none');
    });
  }

  updateEdgeStyle();

  console.log('Graph Editor initialized successfully!');
});
