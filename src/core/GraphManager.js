/**
 * GraphManager - клас для управління графом Cytoscape
 */
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import cxtmenu from 'cytoscape-cxtmenu';
import { graphStyles } from '../styles/graph-styles.js';

// Реєстрація плагінів
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

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
   * Стилі графа (імпортовані з окремого файлу)
   */
  getGraphStyle() {
    return graphStyles;
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
