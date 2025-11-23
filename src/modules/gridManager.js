import { drawGrid } from '../utils/grid.js';

export class GridManager {
  constructor(cy, state) {
    this.cy = cy;
    this.state = state;
    this.gridCanvas = document.getElementById('gridCanvas');
    this.toggleSnapElement = document.getElementById('toggleSnap');
    this.gridSizeInput = document.getElementById('gridSizeInput');

    this.init();
  }

  init() {
    this.setupRenderListener();
    this.setupEventListeners();
    this.handleResize();
  }

  setupRenderListener() {
    this.cy.on('render', () => {
      if (this.state.snapEnabled) {
        drawGrid(this.cy, this.gridCanvas, this.state.gridSize);
      } else {
        const ctx = this.gridCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
      }
    });
  }

  setupEventListeners() {
    this.toggleSnapElement?.addEventListener('change', (e) => {
      this.state.snapEnabled = e.target.checked;
      this.cy.emit('render');
    });

    this.gridSizeInput?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0) {
        this.state.gridSize = val;
        this.cy.emit('render');
      }
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    const container = this.cy.container();
    if (container) {
      this.gridCanvas.width = container.clientWidth;
      this.gridCanvas.height = container.clientHeight;
      this.cy.emit('render');
    }
  }
}