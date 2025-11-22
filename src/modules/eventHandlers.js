import { snapToGrid } from '../utils/grid.js';
import _ from 'lodash';

export class EventManager {
  constructor(cy, state, historyManager) {
    this.cy = cy;
    this.state = state;
    this.historyManager = historyManager;

    // Debounce для saveHistory при перетягуванні
    this.debouncedSave = _.debounce(() => {
      this.historyManager.saveHistory();
    }, 300);

    this.init();
  }

  init() {
    this.setupEdgeHandleEvents();
    this.setupTapEvents();
    this.setupNodeEvents();
    this.setupEdgeEvents();
    this.setupDragEvents();
    this.setupMouseEvents();
  }

  setupEdgeHandleEvents() {
    this.cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
      this.cy.elements('.eh-ghost, .eh-preview-active').remove();
      this.historyManager.saveHistory();
    });
  }

  setupTapEvents() {
    this.cy.on("tap", (event) => {
      if (this.state.activeMode === "node" && event.target === this.cy) {
        this.handleNodeCreation(event.position);
      }

      if (event.target === this.cy) {
        this.clearSelection();
      }
    });
  }

  setupNodeEvents() {
    this.cy.on('tap', 'node', (event) => {
      const node = event.target;

      this.cy.startBatch();
      this.cy.elements().removeClass('active-node');
      node.addClass('active-node');
      this.cy.endBatch();
    });
  }

  setupEdgeEvents() {
    this.cy.on('tap', 'edge', (event) => {
      const edge = event.target;

      this.cy.startBatch();
      this.cy.elements().removeClass('active-edge');
      edge.addClass('active-edge');
      this.cy.endBatch();
    });

    this.cy.on('dblclick', 'edge', (event) => {
      if (this.state.activeMode !== "arrow") return;
      this.handleEdgeWeightEdit(event);
    });
  }

  handleNodeCreation(position) {
    const isTooClose = this.cy.nodes().some((node) => {
      const nodePos = node.position();
      const distance = Math.hypot(nodePos.x - position.x, nodePos.y - position.y);
      return distance < this.state.nodeRadius;
    });

    if (!isTooClose) {
      let finalPosition = position;
      if (this.state.snapEnabled) {
        finalPosition = snapToGrid(position, this.state.gridSize);
      }

      this.cy.add({
        group: "nodes",
        data: { id: `v${this.state.nodeCount++}` },
        position: finalPosition,
      });
      this.historyManager.saveHistory();
    }
  }

  clearSelection() {
    this.cy.startBatch();

    // Об'єднуємо всі removeClass в один виклик elements()
    this.cy.elements().removeClass('selected highlighted active-node active-edge');

    this.cy.endBatch();

    this.state.selectedNodeId = null;
  }

  setupDragEvents() {
    this.cy.on('add', 'edge', (event) => {
      this.handleEdgeAdd(event);
    });

    this.cy.on('free', 'node', (evt) => {
      const node = evt.target;

      // Якщо snap увімкнено - вирівнюємо по сітці
      if (this.state.snapEnabled) {
        const pos = node.position();
        const snappedPos = snapToGrid(pos, this.state.gridSize);
        node.position(snappedPos);
      }

      // Використовуємо debounced версію для зменшення кількості викликів
      this.debouncedSave();
    });
  }

  setupMouseEvents() {
    this.cy.on('mouseover', 'node', (event) => {
      if (this.state.activeMode === "edge") {
        event.target.addClass('highlighted');
      }
    });

    this.cy.on('mouseout', 'node', (event) => {
      if (this.state.activeMode === "edge") {
        event.target.removeClass('highlighted');
      }
    });
  }

  handleEdgeAdd(event) {
    const edge = event.target.data();

    const sourceExists = this.cy.getElementById(edge.source).length > 0;
    const targetExists = this.cy.getElementById(edge.target).length > 0;
    const isPreview = this.cy.$(`edge[source="${edge.source}"][target="${edge.target}"].eh-preview`).length > 0;

    if (!sourceExists || !targetExists || isPreview) {
      return;
    }

    const duplicateEdge = this.cy.edges().some(existingEdge =>
      (existingEdge.data('source') === edge.source && existingEdge.data('target') === edge.target) ||
      (!this.state.isDirected && existingEdge.data('source') === edge.target && existingEdge.data('target') === edge.source)
    );

    if (duplicateEdge) {
      return;
    }

    this.historyManager.saveHistory();
  }

  handleEdgeWeightEdit(event) {
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

    const saveValue = () => {
      const weight = input.value.trim();
      edge.data("weight", weight || "");
      document.body.removeChild(input);
      this.historyManager.saveHistory();
    };

    input.addEventListener("blur", saveValue);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveValue();
    });
  }
}
