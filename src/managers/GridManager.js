/**
 * GridManager - клас для управління сіткою
 */
export class GridManager {
  constructor(cy, canvasId, config = {}) {
    this.cy = cy;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = config.gridSize || 50;
    this.snapEnabled = config.snapEnabled !== undefined ? config.snapEnabled : true;

    this.setupEventListeners();
  }

  /**
   * Налаштування слухачів подій
   */
  setupEventListeners() {
    this.cy.on('render', () => {
      if (this.snapEnabled) {
        this.drawGrid();
      } else {
        this.clearGrid();
      }
    });
  }

  /**
   * Прив'язка координат до сітки
   */
  snapToGrid(pos) {
    if (!this.snapEnabled) return pos;

    const x = Math.round(pos.x / this.gridSize) * this.gridSize;
    const y = Math.round(pos.y / this.gridSize) * this.gridSize;
    return { x, y };
  }

  /**
   * Малювання сітки
   */
  drawGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const pan = this.cy.pan();
    const zoom = this.cy.zoom();

    const w = this.cy.width();
    const h = this.cy.height();

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
    this.ctx.strokeStyle = gridLineColor;
    this.ctx.lineWidth = 1;

    // Вертикальні лінії
    const startWorldX = Math.floor(topLeft.x / this.gridSize) * this.gridSize;
    const endWorldX = Math.ceil(bottomRight.x / this.gridSize) * this.gridSize;

    for (let x = startWorldX; x <= endWorldX; x += this.gridSize) {
      const screenX = x * zoom + pan.x;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, h);
      this.ctx.stroke();
    }

    // Горизонтальні лінії
    const startWorldY = Math.floor(topLeft.y / this.gridSize) * this.gridSize;
    const endWorldY = Math.ceil(bottomRight.y / this.gridSize) * this.gridSize;

    for (let y = startWorldY; y <= endWorldY; y += this.gridSize) {
      const screenY = y * zoom + pan.y;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(w, screenY);
      this.ctx.stroke();
    }
  }

  /**
   * Очищення сітки
   */
  clearGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Встановлення розміру сітки
   */
  setGridSize(size) {
    if (!isNaN(size) && size > 0) {
      this.gridSize = size;
      this.cy.emit('render');
    }
  }

  /**
   * Увімкнення/вимкнення прив'язки до сітки
   */
  setSnapEnabled(enabled) {
    this.snapEnabled = enabled;
    this.cy.emit('render');
  }

  /**
   * Отримання розміру сітки
   */
  getGridSize() {
    return this.gridSize;
  }

  /**
   * Перевірка чи увімкнена прив'язка
   */
  isSnapEnabled() {
    return this.snapEnabled;
  }
}
