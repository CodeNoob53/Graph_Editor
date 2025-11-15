export function snapToGrid(pos, gridSize) {
  const x = Math.round(pos.x / gridSize) * gridSize;
  const y = Math.round(pos.y / gridSize) * gridSize;
  return { x, y };
}

export function drawGrid(cy, gridCanvas, gridSize) {
  const ctx = gridCanvas.getContext('2d');
  ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

  const pan = cy.pan();
  const zoom = cy.zoom();

  const w = cy.width();
  const h = cy.height();

  const topLeft = {
    x: (-pan.x) / zoom,
    y: (-pan.y) / zoom
  };

  const bottomRight = {
    x: (w - pan.x) / zoom,
    y: (h - pan.y) / zoom
  };

  const gridLineColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--grid-line-color')
    .trim();
  ctx.strokeStyle = gridLineColor;
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
