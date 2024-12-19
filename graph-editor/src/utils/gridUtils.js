// src/utils/gridUtils.js

// Прив’язка до сітки координат
export function snapToGrid(pos, gridSize) {
    const x = Math.round(pos.x / gridSize) * gridSize;
    const y = Math.round(pos.y / gridSize) * gridSize;
    return { x, y };
  }
  
  // Функція для малювання сітки – залежить від пану, масштабу
  export function drawGrid(cy, ctx, gridSize, snapEnabled) {
    const w = cy.width();
    const h = cy.height();
    ctx.clearRect(0, 0, w, h);
  
    if (!snapEnabled) return;
  
    const pan = cy.pan();
    const zoom = cy.zoom();
  
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
  