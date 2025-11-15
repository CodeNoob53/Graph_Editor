/**
 * GraphManager - клас для управління графом Cytoscape
 */
export class GraphManager {
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.nodeCount = 0;
    this.isDirected = config.isDirected !== undefined ? config.isDirected : true;
    this.activeMode = "arrow";
    this.selectedNodeId = null;
    this.nodeRadius = config.nodeRadius || 30;

    this.cy = this.initializeCytoscape(config);
    this.setupEdgeHandles();
  }

  /**
   * Ініціалізація Cytoscape
   */
  initializeCytoscape(config) {
    const cy = cytoscape({
      container: document.getElementById(this.containerId),
      minZoom: 0.1,
      maxZoom: 4.0,
      wheelSensitivity: 0.05,
      zoom: 1.0,
      style: this.getGraphStyle(),
      layout: { name: 'grid', rows: 1 }
    });

    this.updateEdgeStyle();
    return cy;
  }

  /**
   * Стилі графа
   */
  getGraphStyle() {
    return [
      {
        selector: 'node',
        style: {
          'background-color': '#5F8670',
          'label': 'data(id)',
          'width': 38,
          'height': 38,
          'color': 'white',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '26px',
          'border-width': 1,
          'border-color': '#005bb5',
          'border-style': 'solid',
          'padding': '5px',
          'events': 'yes',
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#6599ed',
          'target-arrow-color': '#3676ff',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(weight)',
          'font-size': '12px',
          'color': 'black',
          'text-background-color': '#ffffff',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle',
          'text-background-padding': '2px',
          'text-border-color': '#ccc',
          'text-border-width': '1px',
          'text-border-style': 'solid',
          'text-border-opacity': 1
        }
      },
      {
        selector: 'edge[weight]',
        style: {
          'label': 'data(weight)',
          'font-size': '12px',
          'color': 'black',
          'text-background-color': '#ffffff',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle'
        }
      },
      {
        selector: ".highlighted",
        style: {
          "background-color": "#ff5d00",
          "line-color": "#ff5d00",
          "target-arrow-color": "#f7ba80"
        }
      },
      {
        selector: '.eh-handle',
        style: {
          'background-color': 'red',
          'width': 12,
          'height': 12,
          'shape': 'ellipse',
          'overlay-opacity': 0,
          'border-width': 12,
          'border-opacity': 0
        }
      },
      {
        selector: '.eh-hover',
        style: {
          'background-color': 'red'
        }
      },
      {
        selector: '.eh-source',
        style: {
          'border-width': 2,
          'border-color': 'red'
        }
      },
      {
        selector: '.eh-target',
        style: {
          'border-width': 2,
          'border-color': 'red'
        }
      },
      {
        selector: '.eh-preview, .eh-ghost-edge',
        style: {
          'background-color': 'red',
          'line-color': 'red',
          'target-arrow-color': 'red',
          'source-arrow-color': 'red'
        }
      },
      {
        selector: '.eh-ghost-edge.eh-preview-active',
        style: {
          'opacity': 0
        }
      },
      {
        selector: '.active-node',
        style: {
          'background-color': 'black',
          'border-color': '#FF8C00',
          'border-width': '2px',
          'background-opacity': 0.8
        }
      },
      {
        selector: '.active-edge',
        style: {
          'line-color': '#FFD700',
          'width': '4px',
          'target-arrow-color': '#FFD700',
          'source-arrow-color': '#FFD700',
          'opacity': 1
        }
      }
    ];
  }

  /**
   * Налаштування edgehandles
   */
  setupEdgeHandles() {
    this.eh = this.cy.edgehandles({
      snap: true,
      handleNodes: 'node',
      handleSize: 10,
      handleColor: 'red',
      hoverDelay: 150,
      edgeType: (sourceNode, targetNode) => {
        return this.isDirected ? 'flat' : 'node';
      },
      edgeParams: (sourceNode, targetNode) => {
        // Перевірка на самопетлі
        if (sourceNode.id() === targetNode.id()) {
          console.log('Self-loops are not allowed.');
          return null;
        }

        // Перевірка на дублікати
        const existingEdge = this.cy.edges().some(edge =>
          (edge.source().id() === sourceNode.id() && edge.target().id() === targetNode.id()) ||
          (edge.source().id() === targetNode.id() && edge.target().id() === sourceNode.id())
        );

        if (existingEdge) {
          console.log('Duplicate edges are not allowed.');
          return null;
        }

        return {
          data: {
            source: sourceNode.id(),
            target: targetNode.id(),
          },
          classes: this.isDirected ? 'directed' : '',
        };
      },
    });
  }

  /**
   * Додавання вузла
   */
  addNode(position, snapToGridFn = null) {
    let finalPosition = position;
    if (snapToGridFn) {
      finalPosition = snapToGridFn(position);
    }

    this.cy.add({
      group: "nodes",
      data: { id: `v${this.nodeCount++}` },
      position: finalPosition,
    });
  }

  /**
   * Перевірка чи позиція занадто близька до існуючих вузлів
   */
  isTooClose(position) {
    return this.cy.nodes().some((node) => {
      const nodePos = node.position();
      const distance = Math.hypot(nodePos.x - position.x, nodePos.y - position.y);
      return distance < this.nodeRadius;
    });
  }

  /**
   * Очищення графа
   */
  clearGraph() {
    this.cy.elements().remove();
    this.nodeCount = 0;
  }

  /**
   * Встановлення режиму роботи
   */
  setMode(mode) {
    this.activeMode = mode;
    this.selectedNodeId = null;

    if (mode !== "edge") {
      this.eh.disableDrawMode();
    }
  }

  /**
   * Увімкнення режиму додавання ребер
   */
  enableEdgeMode() {
    this.setMode("edge");
    this.eh.enableDrawMode();
  }

  /**
   * Вимкнення режиму додавання ребер
   */
  disableEdgeMode() {
    this.setMode("arrow");
    this.eh.disableDrawMode();
  }

  /**
   * Оновлення типу графа (направлений/ненаправлений)
   */
  setDirected(isDirected) {
    this.isDirected = isDirected;
    this.updateEdgeStyle();
  }

  /**
   * Оновлення стилів ребер
   */
  updateEdgeStyle() {
    this.cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', this.isDirected ? 'triangle' : 'none');
    });
  }

  /**
   * Очищення підсвічування
   */
  clearHighlights() {
    this.cy.elements().removeClass('highlighted');
    this.cy.elements().removeClass('active-node');
    this.cy.elements().removeClass('active-edge');
  }

  /**
   * Підсвічування шляху
   */
  highlightPath(path) {
    this.clearHighlights();
    path.forEach((nodeId, index) => {
      this.cy.$(`#${nodeId}`).addClass('highlighted');
      if (index < path.length - 1) {
        const edge = this.cy.edges().filter(edge => {
          const source = edge.data('source');
          const target = edge.data('target');
          return (
            (source === nodeId && target === path[index + 1]) ||
            (target === nodeId && source === path[index + 1])
          );
        });
        edge.addClass('highlighted');
      }
    });
  }

  /**
   * Підсвічування ребер
   */
  highlightEdges(mstEdges) {
    this.clearHighlights();
    const nodesToHighlight = new Set();
    mstEdges.forEach(edgeInfo => {
      const edge = this.cy.edges().filter(e => {
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });
      edge.addClass('highlighted');
      nodesToHighlight.add(edgeInfo.source);
      nodesToHighlight.add(edgeInfo.target);
    });
    nodesToHighlight.forEach(nodeId => this.cy.$(`#${nodeId}`).addClass('highlighted'));
  }

  /**
   * Підсвічування вузлів та ребер
   */
  highlightNodesAndEdges(nodes, edges) {
    this.clearHighlights();
    nodes.forEach(nodeId => {
      this.cy.$(`#${nodeId}`).addClass('highlighted');
    });
    edges.forEach(edgeInfo => {
      const edge = this.cy.edges().filter(e => {
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });
      edge.addClass('highlighted');
    });
  }

  /**
   * Отримання інформації про граф
   */
  getGraphInfo() {
    const nodes = this.cy.nodes().map(node => node.id());
    const edges = this.cy.edges().map(edge => ({
      source: edge.data("source"),
      target: edge.data("target"),
      weight: edge.data("weight") || "N/A"
    }));

    return {
      nodes,
      edges,
      isDirected: this.isDirected
    };
  }

  /**
   * Експорт графа в JSON
   */
  exportToJSON() {
    return {
      nodes: this.cy.nodes().map(node => ({
        data: {
          id: node.id(),
          ...node.data()
        },
        position: node.position()
      })),
      edges: this.cy.edges().map(edge => ({
        data: {
          source: edge.data('source'),
          target: edge.data('target'),
          ...edge.data()
        }
      }))
    };
  }

  /**
   * Імпорт графа з JSON
   */
  importFromJSON(graphData) {
    if (!graphData.nodes || !graphData.edges) {
      throw new Error("Invalid graph format. Must include 'nodes' and 'edges'.");
    }

    this.cy.elements().remove();

    graphData.nodes.forEach(node => {
      this.cy.add({
        group: 'nodes',
        data: { id: node.data.id, ...node.data },
        position: node.position || { x: 0, y: 0 }
      });
    });

    graphData.edges.forEach(edge => {
      this.cy.add({
        group: 'edges',
        data: { source: edge.data.source, target: edge.data.target, ...edge.data }
      });
    });

    this.updateEdgeStyle();
  }

  /**
   * Отримання стану графа
   */
  getState() {
    return JSON.parse(JSON.stringify(this.cy.json()));
  }

  /**
   * Відновлення стану графа
   */
  restoreState(state) {
    this.cy.json(state);
  }
}
