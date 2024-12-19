import { useEffect } from 'react';

export default function useGrid(cy, canvasRef, { gridSize = 50, snapEnabled = true }) {
  useEffect(() => {
    if (!cy || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    function drawGrid() {
      const w = cy.width();
      const h = cy.height();
      const pan = cy.pan();
      const zoom = cy.zoom();
      ctx.clearRect(0, 0, w, h);
      
      if (!snapEnabled) return;

      const topLeft = {
        x: (-pan.x) / zoom,
        y: (-pan.y) / zoom
      };

      const bottomRight = {
        x: (w - pan.x) / zoom,
        y: (h - pan.y) / zoom
      };

      ctx.strokeStyle = 'rgba(90, 90, 90, 0.13)';
      ctx.lineWidth = 1;

      const startWorldX = Math.floor(topLeft.x / gridSize) * gridSize;
      const endWorldX = Math.ceil(bottomRight.x / gridSize) * gridSize;

      for (let x = startWorldX; x <= endWorldX; x += gridSize) {
        const screenX = x * zoom + pan.x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, h);
        ctx.stroke();
      }

      const startWorldY = Math.floor(topLeft.y / gridSize) * gridSize;
      const endWorldY = Math.ceil(bottomRight.y / gridSize) * gridSize;

      for (let y = startWorldY; y <= endWorldY; y += gridSize) {
        const screenY = y * zoom + pan.y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(w, screenY);
        ctx.stroke();
      }
    }

    cy.on('render', drawGrid);
    drawGrid(); // Намалювати один раз спочатку

    return () => {
      cy.off('render', drawGrid);
    };
  }, [cy, canvasRef, gridSize, snapEnabled]);
}
