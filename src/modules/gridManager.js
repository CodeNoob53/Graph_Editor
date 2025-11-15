import { drawGrid } from '../utils/grid.js';

export function setupGridManager(cy, state) {
  const gridCanvas = document.getElementById('gridCanvas');

  cy.on('render', () => {
    if (state.snapEnabled) {
      drawGrid(cy, gridCanvas, state.gridSize);
    } else {
      const ctx = gridCanvas.getContext('2d');
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }
  });

  document.getElementById('toggleSnap')?.addEventListener('change', (e) => {
    state.snapEnabled = e.target.checked;
    cy.emit('render');
  });

  document.getElementById('gridSizeInput')?.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      state.gridSize = val;
      cy.emit('render');
    }
  });
}
