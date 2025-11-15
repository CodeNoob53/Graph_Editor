export class ZoomManager {
  constructor(cy) {
    this.cy = cy;
    this.zoomDisplay = document.getElementById("zoomDisplay");

    if (!this.zoomDisplay) {
      return;
    }

    this.init();
  }

  init() {
    this.cy.on("zoom", () => this.updateDisplay());
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.zoomDisplay) {
      this.zoomDisplay.innerText = `Zoom: ${(this.cy.zoom() * 100).toFixed(0)}%`;
    }
  }
}
