export function setupZoomDisplay(cy) {
  const zoomDisplay = document.getElementById("zoomDisplay");

  if (!zoomDisplay) {
    console.warn('Zoom display element not found');
    return;
  }

  function updateZoomDisplay() {
    zoomDisplay.innerText = `Zoom: ${(cy.zoom() * 100).toFixed(0)}%`;
  }

  cy.on("zoom", updateZoomDisplay);
  updateZoomDisplay();
}
