import { initCytoscape } from './config/cytoscapeConfig.js';
import { EdgeManager } from './modules/edgeHandles.js';
import { EventManager } from './modules/eventHandlers.js';
import { UIManager } from './modules/uiHandlers.js';
import { GridManager } from './modules/gridManager.js';
import { ZoomManager } from './modules/zoomDisplay.js';
import { KeyboardManager } from './modules/keyboardManager.js';
import { HistoryManager } from './utils/history.js';

export class GraphEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found!`);
    }

    this.state = {
      nodeCount: 0,
      gridSize: 50,
      activeMode: "arrow",
      selectedNodeId: null,
      snapEnabled: true,
      isDirected: true,
      nodeRadius: 30
    };

    this.init();
  }

  init() {
    this.cy = initCytoscape(this.container);

    this.historyManager = new HistoryManager(this.cy);
    this.edgeManager = new EdgeManager(this.cy, this.state);
    this.eventManager = new EventManager(this.cy, this.state, this.historyManager);
    this.uiManager = new UIManager(this.cy, this.state, this.historyManager, this.edgeManager);
    this.gridManager = new GridManager(this.cy, this.state);
    this.zoomManager = new ZoomManager(this.cy);
    this.keyboardManager = new KeyboardManager(this.cy, this.state, this.historyManager);

    this.updateEdgeStyle();

    // Зберегти початковий (порожній) стан
    this.historyManager.saveHistory();
  }

  updateEdgeStyle() {
    this.cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', this.state.isDirected ? 'triangle' : 'none');
    });
  }

  getCytoscape() {
    return this.cy;
  }

  getState() {
    return this.state;
  }

  destroy() {
    if (this.cy) {
      this.cy.destroy();
    }
  }
}
