import { snapToGrid } from '../utils/grid.js';

export function setupEventHandlers(cy, state, historyManager) {
  const { nodeRadius } = state;

  cy.on('ehstart', () => {
    console.log('Edge handle started');
  });

  cy.on('ehstop', () => {
    console.log('Edge handle stopped');
  });

  cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
    console.log('ehcomplete event triggered');
    console.log('Source Node:', sourceNode.id());
    console.log('Target Node:', targetNode.id());
    console.log('Added Edge:', addedEdge.data());

    cy.elements('.eh-ghost, .eh-preview-active').remove();
    historyManager.saveHistory();
  });

  cy.on("tap", (event) => {
    if (state.activeMode === "node" && event.target === cy) {
      const position = event.position;
      const isTooClose = cy.nodes().some((node) => {
        const nodePos = node.position();
        const distance = Math.hypot(nodePos.x - position.x, nodePos.y - position.y);
        return distance < nodeRadius;
      });

      if (!isTooClose) {
        let finalPosition = position;
        if (state.snapEnabled) {
          finalPosition = snapToGrid(position, state.gridSize);
        }

        cy.add({
          group: "nodes",
          data: { id: `v${state.nodeCount++}` },
          position: finalPosition,
        });
        historyManager.saveHistory();
      }
    }

    if (event.target === cy) {
      cy.$('.selected').removeClass('selected');
      cy.$('.highlighted').removeClass('highlighted');
      state.selectedNodeId = null;
      cy.elements().removeClass('active-node');
      cy.elements().removeClass('active-edge');
    }
  });

  cy.on('tap', 'node', (event) => {
    const node = event.target;
    cy.elements().removeClass('active-node');
    node.addClass('active-node');
  });

  cy.on('tap', 'edge', (event) => {
    const edge = event.target;
    cy.elements().removeClass('active-edge');
    edge.addClass('active-edge');
  });

  cy.on('add', 'edge', (event) => {
    const edge = event.target.data();

    const sourceExists = cy.getElementById(edge.source).length > 0;
    const targetExists = cy.getElementById(edge.target).length > 0;
    const isPreview = cy.$(`edge[source="${edge.source}"][target="${edge.target}"].eh-preview`).length > 0;

    if (!sourceExists || !targetExists || isPreview) {
      console.log('Skipped adding invalid or preview edge:', edge);
      return;
    }

    const duplicateEdge = cy.edges().some(existingEdge =>
      (existingEdge.data('source') === edge.source && existingEdge.data('target') === edge.target) ||
      (!state.isDirected && existingEdge.data('source') === edge.target && existingEdge.data('target') === edge.source)
    );

    if (duplicateEdge) {
      console.log('Skipped adding duplicate edge:', edge);
      return;
    }

    console.log('Edge added:', edge);
    historyManager.saveHistory();
  });

  cy.on('free', 'node', (evt) => {
    if (!state.snapEnabled) return;
    const node = evt.target;
    const pos = node.position();
    const snappedPos = snapToGrid(pos, state.gridSize);
    node.position(snappedPos);
    historyManager.saveHistory();
  });

  cy.on("dblclick", "edge", (event) => {
    if (state.activeMode !== "arrow") return;

    const edge = event.target;
    const edgePosition = event.renderedPosition;
    const input = document.createElement("input");

    input.type = "number";
    input.placeholder = "Enter weight";
    input.value = edge.data("weight") || "";
    Object.assign(input.style, {
      position: "absolute",
      left: `${edgePosition.x}px`,
      top: `${edgePosition.y}px`,
      transform: "translate(-50%, -50%)",
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      zIndex: "1000",
    });

    document.body.appendChild(input);
    input.focus();

    function saveValue() {
      const weight = input.value.trim();
      edge.data("weight", weight || "");
      document.body.removeChild(input);
      historyManager.saveHistory();
    }

    input.addEventListener("blur", saveValue);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveValue();
    });
  });

  cy.on('mouseover', 'node', (event) => {
    if (state.activeMode === "edge") {
      event.target.addClass('highlighted');
    }
  });

  cy.on('mouseout', 'node', (event) => {
    if (state.activeMode === "edge") {
      event.target.removeClass('highlighted');
    }
  });
}
