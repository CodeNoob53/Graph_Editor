import { calculatePrimMST } from '../algorithms/mst.js';
import { findShortestPath } from '../algorithms/shortestPath.js';
import { findMinWeightedPathForFourVertices } from '../algorithms/minWeightedPath.js';
import { generateAllSpanningTrees } from '../algorithms/spanningTrees.js';
import { findEulerTrailAndCircuit } from '../algorithms/euler.js';
import { findHamiltonianCycles } from '../algorithms/hamiltonian.js';
import { findMaxFlowEdmondsKarp } from '../algorithms/edmondsKarp.js';
import { depthFirstSearch, breadthFirstSearch, checkConnectivity, detectCycle } from '../algorithms/traversal.js';
import { topologicalSort } from '../algorithms/topologicalSort.js';
import { findStronglyConnectedComponents } from '../algorithms/scc.js';
import { calculatePageRank } from '../algorithms/pagerank.js';
import { findBridgesAndArticulationPoints } from '../algorithms/bridgesAndArticulation.js';
import { findPathAStar } from '../algorithms/astar.js';
import { calculateKruskalMST } from '../algorithms/kruskal.js';
import { findPathBellmanFord } from '../algorithms/bellmanFord.js';
import { highlightPath, highlightEdges, highlightNodesAndEdges, clearHighlights, animatePageRank, animateTopologicalSort } from '../utils/highlight.js';
import {
  generateCompleteGraph,
  generateTree,
  generateRandomGraph,
  generateCycle,
  generateBipartiteGraph,
  generateStarGraph
} from '../utils/graphGenerator.js';

export class UIManager {
  constructor(cy, state, historyManager, edgeManager) {
    this.cy = cy;
    this.state = state;
    this.historyManager = historyManager;
    this.edgeManager = edgeManager;

    this.init();
  }

  // Helper функції для форматування повідомлень
  formatMessage(type, title, content, details = null) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const icon = icons[type] || icons.info;
    const detailsHtml = details ? `<div class="info-details">${details}</div>` : '';

    return `
      <div class="info-message info-${type}">
        <h3><i class="fas ${icon}"></i> ${title}</h3>
        ${content}
        ${detailsHtml}
      </div>
    `;
  }

  showSuccess(title, content, details = null) {
    document.getElementById('info').innerHTML = this.formatMessage('success', title, content, details);
  }

  showError(title, content, details = null) {
    document.getElementById('info').innerHTML = this.formatMessage('error', title, content, details);
  }

  showWarning(title, content, details = null) {
    document.getElementById('info').innerHTML = this.formatMessage('warning', title, content, details);
  }

  showInfo(title, content, details = null) {
    document.getElementById('info').innerHTML = this.formatMessage('info', title, content, details);
  }

  init() {
    this.setupModeButtons();
    this.setupGraphButtons();
    this.setupHistoryButtons();
    this.setupImportExportButtons();
    this.setupAlgorithmButtons();
    this.setupUIToggleButtons();
    this.setupGraphGenerator();
    this.setupLayoutControls();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.cy.on('tap', (event) => {
      if (event.target === this.cy) {
        clearHighlights(this.cy);
      }
    });
  }

  setupLayoutControls() {
    const layoutSelect = document.getElementById('layoutSelect');
    layoutSelect?.addEventListener('change', () => {
      const layoutName = layoutSelect.value;
      this.applyLayout(layoutName);
    });
  }

  applyLayout(name) {
    const nodeCount = this.cy.nodes().length;

    // Для великих графів вимикаємо анімацію
    const shouldAnimate = nodeCount < 50;

    let options = {
      name: name,
      animate: shouldAnimate,
      animationDuration: shouldAnimate ? 500 : 0,
      padding: 50,
      fit: true
    };

    switch (name) {
      case 'dagre':
        options = {
          ...options,
          rankDir: 'TB',
          spacingFactor: 2.0,
          nodeSep: 80,
          rankSep: 100
        };
        break;
      case 'cose':
        // Оптимізація параметрів в залежності від розміру графа
        const iterations = nodeCount < 30 ? 1000 :
                          nodeCount < 60 ? 300 :
                          nodeCount < 100 ? 100 : 50;

        options = {
          ...options,
          idealEdgeLength: 150,
          nodeOverlap: 20,
          refresh: nodeCount < 50 ? 20 : 10,
          fit: true,
          padding: 30,
          randomize: false,
          componentSpacing: 150,
          nodeRepulsion: 1000000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: iterations,
          initialTemp: nodeCount < 50 ? 200 : 100,
          coolingFactor: 0.95,
          minTemp: 1.0
        };
        break;
      case 'circle':
        options = {
          ...options,
          radius: Math.min(400, Math.max(200, nodeCount * 30))
        };
        break;
      case 'concentric':
        options = {
          ...options,
          minNodeSpacing: 100,
          levelWidth: () => 1
        };
        break;
    }

    this.cy.layout(options).run();
  }

  setMode(mode) {
    this.state.activeMode = mode;
    this.state.selectedNodeId = null;

    if (mode !== "edge") {
      this.edgeManager.disableDrawMode();
    }
  }

  updateEdgeStyle() {
    this.cy.edges().forEach(edge => {
      edge.style('target-arrow-shape', this.state.isDirected ? 'triangle' : 'none');
    });
  }

  setupModeButtons() {
    const addNodeButton = document.getElementById("addNode");
    addNodeButton?.addEventListener("click", () => this.setMode("node"));

    const addEdgeButton = document.getElementById('addEdge');
    addEdgeButton?.addEventListener('click', () => {
      if (this.state.activeMode !== "edge") {
        this.setMode("edge");
        this.edgeManager.enableDrawMode();
      } else {
        this.setMode("arrow");
        this.edgeManager.disableDrawMode();
      }
    });

    const mouseArrowButton = document.getElementById("mouseArrow");
    mouseArrowButton?.addEventListener("click", () => this.setMode("arrow"));
  }

  setupGraphButtons() {
    const clearGraphButton = document.getElementById("clearGraph");
    clearGraphButton?.addEventListener("click", () => {
      this.cy.elements().remove();
      this.state.nodeCount = 0;
      this.historyManager.saveHistory();
    });

    const directedCheckbox = document.getElementById("directedGraph");
    directedCheckbox?.addEventListener("change", () => {
      this.state.isDirected = directedCheckbox.checked;
      this.updateEdgeStyle();
    });

    const getInfoButton = document.getElementById('getInfo');
    getInfoButton?.addEventListener('click', () => {
      const nodes = this.cy.nodes();
      const edges = this.cy.edges();
      this.showInfo(
        'Graph Information',
        `
          <p>Nodes: ${nodes.length}</p>
          <p>Edges: ${edges.length}</p>
          <p>Type: ${this.state.isDirected ? 'Directed' : 'Undirected'}</p>
        `
      );
    });
  }

  setupHistoryButtons() {
    const undoButton = document.getElementById('undo');
    undoButton?.addEventListener('click', () => {
      this.historyManager.undo();
    });

    const redoButton = document.getElementById('redo');
    redoButton?.addEventListener('click', () => {
      this.historyManager.redo();
    });
  }

  setupImportExportButtons() {
    const exportButton = document.getElementById('exportGraph');
    exportButton?.addEventListener('click', () => {
      const graphData = this.cy.json();
      const dataStr = JSON.stringify(graphData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graph.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    const importButton = document.getElementById('importGraph');
    importButton?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const graphData = JSON.parse(event.target.result);
            this.cy.json(graphData);
            this.historyManager.saveHistory();
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  setupAlgorithmButtons() {
    const calculateMSTButton = document.getElementById('calculateMST');
    calculateMSTButton?.addEventListener('click', () => {
      const result = calculatePrimMST(this.cy, this.state.isDirected);
      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        highlightEdges(this.cy, result.mst, this.state.isDirected);
        this.showSuccess(
          'Мінімальне остовне дерево (Prim\'s)',
          `
            <p><strong>Загальна вага:</strong> ${result.totalWeight.toFixed(2)}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Кількість вершин:</strong> ${result.nodeCount}</p>
          `
        );
      }
    });

    const findPathButton = document.getElementById('findPath');
    findPathButton?.addEventListener('click', () => {
      const source = document.getElementById('sourceNode').value.trim();
      const target = document.getElementById('targetNode').value.trim();

      if (!source || !target) {
        this.showWarning(
          'Введіть вершини',
          '<p>Будь ласка, введіть вихідну та цільову вершини</p>'
        );
        return;
      }

      const result = findShortestPath(this.cy, source, target, this.state.isDirected);
      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        highlightPath(this.cy, result.path, this.state.isDirected);
        const arrow = this.state.isDirected ? '→' : '—';
        this.showSuccess(
          `Найкоротший шлях (Dijkstra)`,
          `
            <p><strong>Від:</strong> ${source} <strong>До:</strong> ${target}</p>
            <p><strong>Відстань:</strong> ${result.distance.toFixed(2)}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Шлях:</strong> ${result.path.join(` ${arrow} `)}</p>
          `
        );
      }
    });

    const runMaxFlowButton = document.getElementById('runMaxFlow');
    runMaxFlowButton?.addEventListener('click', () => {
      const source = document.getElementById('sourceNode').value.trim();
      const target = document.getElementById('targetNode').value.trim();

      if (!source || !target) {
        this.showWarning(
          'Введіть вершини',
          '<p>Будь ласка, введіть вихідну та цільову вершини (Source/Sink)</p>'
        );
        return;
      }

      const result = findMaxFlowEdmondsKarp(this.cy, source, target);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        // Підсвічуємо ребра з потоком
        clearHighlights(this.cy);
        result.flowDetails.forEach(item => {
          const edge = this.cy.getElementById(item.edgeId);
          edge.addClass('highlighted');
        });

        const flowList = result.flowDetails
          .map(f => `${f.source} → ${f.target}: ${f.flow}/${f.capacity}`)
          .join('<br>');

        this.showSuccess(
          'Максимальний потік (Edmonds-Karp)',
          `
            <p><strong>Витік:</strong> ${source} <strong>Стік:</strong> ${target}</p>
            <p><strong>Значення потоку:</strong> ${result.maxFlow}</p>
          `,
          `
            <p><strong>Деталі потоку:</strong></p>
            <p style="font-family: monospace;">${flowList || 'Потік відсутній'}</p>
          `
        );
      }
    });

    const findMinPathButton = document.getElementById('findMinPath');
    findMinPathButton?.addEventListener('click', () => {
      const result = findMinWeightedPathForFourVertices(this.cy, this.state.isDirected);
      if (result.error) {
        this.showError(result.error, result.details, result.checkedCombinations ? `<p>Перевірено комбінацій: ${result.checkedCombinations}</p>` : null);
      } else {
        highlightNodesAndEdges(this.cy, result.bestFullPath || result.bestPath,
          result.bestEdges || result.bestPath.slice(1).map((node, i) => ({
            source: result.bestPath[i],
            target: node
          })),
          this.state.isDirected
        );
        this.showSuccess(
          'Мінімальний шлях через 4 вершини',
          result.formattedMessage,
          null
        );
        if (window.MathJax) {
          window.MathJax.typeset();
        }
      }
    });

    const listSpanningTreesButton = document.getElementById('listSpanningTrees');
    listSpanningTreesButton?.addEventListener('click', () => {
      const result = generateAllSpanningTrees(this.cy, this.state.isDirected);
      if (result.error) {
        this.showError(result.error, result.details, result.checkedCombinations ? `<p>Перевірено комбінацій: ${result.checkedCombinations}</p>` : null);
      } else {
        this.showSuccess(
          'Всі остовні дерева',
          `
            <p><strong>Знайдено дерев:</strong> ${result.count}</p>
            <p><strong>Вершин в графі:</strong> ${result.nodeCount}</p>
            <p><strong>Ребер в кожному дереві:</strong> ${result.edgesPerTree}</p>
          `,
          `<p>Перевірено комбінацій: ${result.totalCombinations}</p>`
        );
      }
    });

    const eulerCalculationButton = document.getElementById('eulerCalculation');
    eulerCalculationButton?.addEventListener('click', () => {
      const result = findEulerTrailAndCircuit(this.cy, this.state.isDirected);
      if (result.error) {
        this.showError(result.error, result.details, result.stats ? `<p>Тип графу: ${result.graphType}</p>` : null);
      } else {
        const typeLabel = result.type === 'circuit' ? 'Ейлерів цикл' : 'Ейлерів шлях';
        this.showSuccess(
          typeLabel,
          `<p><strong>Результат:</strong> ${result.message}</p>`,
          `
            <p>${result.details}</p>
            <p>Тип графу: ${result.graphType}</p>
          `
        );
      }
    });

    const hamiltonianCalculationButton = document.getElementById('hamiltonianCalculation');
    hamiltonianCalculationButton?.addEventListener('click', () => {
      // Показуємо loader
      const overlay = document.getElementById('overlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }

      // Використовуємо setTimeout щоб UI встиг оновитися
      setTimeout(() => {
        const result = findHamiltonianCycles(this.cy, this.state.isDirected);

        // Приховуємо loader
        if (overlay) {
          overlay.style.display = 'none';
        }

        if (result.error) {
          this.showError(result.error, result.details, result.stats ? `<p>Тип графу: ${result.graphType}</p>` : null);
        } else {
          const cyclesList = result.formattedCycles.join('<br>');
          const additionalInfo = result.additionalCycles > 0
            ? `<p>...та ще ${result.additionalCycles} циклів</p>`
            : '';

          this.showSuccess(
            'Гамільтонові цикли',
            `
              <p><strong>Знайдено циклів:</strong> ${result.count}</p>
              <p><strong>Довжина циклу:</strong> ${result.stats.cycleLength} вершин</p>
            `,
            `
              <p><strong>Перші ${result.showingFirst} циклів:</strong></p>
              <p style="font-family: monospace;">${cyclesList}</p>
              ${additionalInfo}
              <p>Тип графу: ${result.graphType}</p>
            `
          );
        }
      }, 100);
    });

    // DFS Algorithm
    const runDFSButton = document.getElementById('runDFS');
    runDFSButton?.addEventListener('click', () => {
      const startNode = document.getElementById('traversalStartNode').value.trim();

      if (!startNode) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ffa94d;">
            <h3>⚠️ Введіть початкову вершину</h3>
            <p>Будь ласка, введіть ID вершини для початку обходу</p>
          </div>
        `;
        return;
      }

      const result = depthFirstSearch(this.cy, startNode, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details, result.availableNodes ? `<p>Доступні вершини: ${result.availableNodes.join(', ')}</p>` : null);
      } else {
        const arrow = this.state.isDirected ? '→' : '—';
        const completeness = result.isComplete
          ? '✓ Обхід повний (всі вершини відвідані)'
          : `⚠️ Обхід неповний (відвідано ${result.visitedCount} з ${result.totalNodes} вершин)`;

        // Підсвічуємо вершини та ребра обходу
        highlightNodesAndEdges(this.cy, result.traversalOrder, result.traversalEdges, this.state.isDirected);

        const details = `
          <p><strong>Початкова вершина:</strong> ${result.startNode}</p>
          <p><strong>Порядок обходу:</strong> ${result.traversalOrder.join(` ${arrow} `)}</p>
          <p><strong>Відвідано вершин:</strong> ${result.visitedCount} / ${result.totalNodes}</p>
          <p>${completeness}</p>
          <p>Тип графу: ${result.graphType}</p>
        `;

        if (result.isComplete) {
          this.showSuccess(result.algorithm, details);
        } else {
          this.showWarning(result.algorithm, details);
        }
      }
    });

    // BFS Algorithm
    const runBFSButton = document.getElementById('runBFS');
    runBFSButton?.addEventListener('click', () => {
      const startNode = document.getElementById('traversalStartNode').value.trim();

      if (!startNode) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ffa94d;">
            <h3>⚠️ Введіть початкову вершину</h3>
            <p>Будь ласка, введіть ID вершини для початку обходу</p>
          </div>
        `;
        return;
      }

      const result = breadthFirstSearch(this.cy, startNode, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details, result.availableNodes ? `<p>Доступні вершини: ${result.availableNodes.join(', ')}</p>` : null);
      } else {
        const arrow = this.state.isDirected ? '→' : '—';
        const completeness = result.isComplete
          ? '✓ Обхід повний (всі вершини відвідані)'
          : `⚠️ Обхід неповний (відвідано ${result.visitedCount} з ${result.totalNodes} вершин)`;

        // Форматуємо вершини по рівнях
        const levelsList = Object.entries(result.levelGroups)
          .map(([level, nodes]) => `Рівень ${level}: ${nodes.join(', ')}`)
          .join('<br>');

        // Підсвічуємо вершини та ребра обходу
        highlightNodesAndEdges(this.cy, result.traversalOrder, result.traversalEdges, this.state.isDirected);

        const details = `
          <p><strong>Початкова вершина:</strong> ${result.startNode}</p>
          <p><strong>Порядок обходу:</strong> ${result.traversalOrder.join(` ${arrow} `)}</p>
          <p><strong>Відвідано вершин:</strong> ${result.visitedCount} / ${result.totalNodes}</p>
          <p><strong>Максимальний рівень:</strong> ${result.maxLevel}</p>
          <p>${completeness}</p>
          <div style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 4px;">
            <p><strong>Розподіл по рівнях:</strong></p>
            <p style="font-family: monospace;">${levelsList}</p>
          </div>
          <p>Тип графу: ${result.graphType}</p>
        `;

        if (result.isComplete) {
          this.showSuccess(result.algorithm, details);
        } else {
          this.showWarning(result.algorithm, details);
        }
      }
    });

    // Check Connectivity
    const checkConnectivityButton = document.getElementById('checkConnectivity');
    checkConnectivityButton?.addEventListener('click', () => {
      const result = checkConnectivity(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        let componentsInfo = '';
        if (!result.isConnected && result.componentsList) {
          componentsInfo = `
            <div style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 4px;">
              <p><strong>Компоненти зв'язності:</strong></p>
              ${result.componentsList.map((comp, i) =>
            `<p style="font-family: monospace;">Компонента ${i + 1}: {${comp.join(', ')}}</p>`
          ).join('')}
            </div>
          `;
        }

        const details = `
          <p><strong>Результат:</strong> ${result.message}</p>
          <p><strong>Кількість вершин:</strong> ${result.totalNodes}</p>
          <p><strong>Кількість компонент:</strong> ${result.components}</p>
          ${componentsInfo}
        `;

        if (result.isConnected) {
          this.showSuccess("Перевірка зв'язності", details);
        } else {
          this.showWarning("Перевірка зв'язності", details);
        }
      }
    });

    // Detect Cycle
    const detectCycleButton = document.getElementById('detectCycle');
    detectCycleButton?.addEventListener('click', () => {
      const result = detectCycle(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        const details = `
          <p><strong>Результат:</strong> ${result.message}</p>
          <p><strong>Тип графу:</strong> ${result.graphType}</p>
          ${result.hasCycle ? '<p>⚠️ Граф містить один або більше циклів</p>' : '<p>✓ Граф не містить циклів</p>'}
        `;

        if (result.hasCycle) {
          this.showWarning("Виявлення циклів", details);
        } else {
          this.showSuccess("Виявлення циклів", details);
        }
      }
    });



    // Topological Sort
    const runTopologicalSortButton = document.getElementById('runTopologicalSort');
    runTopologicalSortButton?.addEventListener('click', () => {
      const result = topologicalSort(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        const arrow = '→';

        // Використовуємо нову анімацію
        animateTopologicalSort(this.cy, result.steps);

        this.showSuccess(
          result.algorithm,
          `
            <p><strong>Топологічний порядок:</strong> ${result.topologicalOrder.join(` ${arrow} `)}</p>
            <p><strong>Кількість вершин:</strong> ${result.nodeCount}</p>
          `,
          `
            <p><strong>Тип графу:</strong> ${result.graphType}</p>
            <p>Анімація показує алгоритм Кана (видалення вершин з 0 вхідним степенем)</p>
          `
        );
      }
    });

    // SCC (Strongly Connected Components)
    const findSCCButton = document.getElementById('findSCC');
    findSCCButton?.addEventListener('click', () => {
      const result = findStronglyConnectedComponents(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        const componentsHtml = result.componentDetails
          .map(comp => `<p>SCC ${comp.id} (${comp.size} вершин): {${comp.nodes.join(', ')}}</p>`)
          .join('');

        // Підсвічуємо компоненти різними кольорами
        clearHighlights(this.cy);
        result.components.forEach((comp, idx) => {
          // Генеруємо колір для компоненти
          const hue = (idx * 137.508) % 360; // Golden angle approximation
          const color = `hsl(${hue}, 70%, 50%)`;

          comp.forEach(nodeId => {
            this.cy.getElementById(nodeId).animate({
              style: {
                'background-color': color,
                'border-color': color
              }
            }, { duration: 500 });
          });
        });

        this.showSuccess(
          result.algorithm,
          `
            <p><strong>${result.message}</strong></p>
            <p><strong>Кількість компонент:</strong> ${result.componentCount}</p>
            <p><strong>Найбільша компонента:</strong> ${result.largestComponent.length} вершин</p>
          `,
          `
            <p><strong>Компоненти:</strong></p>
            <div style="font-family: monospace;">${componentsHtml}</div>
          `
        );
      }
    });

    // PageRank
    const calculatePageRankButton = document.getElementById('calculatePageRank');
    calculatePageRankButton?.addEventListener('click', () => {
      const result = calculatePageRank(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        const topNodesHtml = result.rankedNodes
          .slice(0, 10)
          .map((node, idx) => `${idx + 1}. ${node.id}: ${node.percentage}%`)
          .join('<br>');

        // Запускаємо анімацію
        animatePageRank(this.cy, result.steps);

        this.showSuccess(
          result.algorithm,
          `
            <p><strong>${result.message}</strong></p>
            <p><strong>Топ-вершина:</strong> ${result.topNode.id} (${result.topNode.percentage}%)</p>
            <p><strong>Ітерацій:</strong> ${result.iterations}</p>
            <p><strong>Damping Factor:</strong> ${result.dampingFactor}</p>
          `,
          `
            <p><strong>Топ-10 вершин за PageRank:</strong></p>
            <p style="font-family: monospace;">${topNodesHtml}</p>
          `
        );
      }
    });

    // Bridges and Articulation Points
    const findBridgesButton = document.getElementById('findBridgesAndArticulation');
    findBridgesButton?.addEventListener('click', () => {
      const result = findBridgesAndArticulationPoints(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        // Підсвічуємо мости
        if (result.bridges && result.bridges.length > 0) {
          highlightEdges(this.cy, result.bridges, this.state.isDirected);
        }

        const bridgesHtml = result.bridges.length > 0
          ? result.bridges.map(b => `${b.source} — ${b.target}`).join(', ')
          : 'Немає';

        const articulationHtml = result.articulationPoints.length > 0
          ? result.articulationPoints.join(', ')
          : 'Немає';

        this.showSuccess(
          result.algorithm,
          `
            <p><strong>${result.message}</strong></p>
            <p><strong>Мостів:</strong> ${result.bridgeCount}</p>
            <p><strong>Точок зчленування:</strong> ${result.articulationPointCount}</p>
          `,
          `
            <p><strong>Мости:</strong> ${bridgesHtml}</p>
            <p><strong>Точки зчленування:</strong> ${articulationHtml}</p>
          `
        );
      }
    });

    // Kruskal MST
    const calculateKruskalButton = document.getElementById('calculateKruskalMST');
    calculateKruskalButton?.addEventListener('click', () => {
      const result = calculateKruskalMST(this.cy, this.state.isDirected);

      if (result.error) {
        this.showError(result.error, result.details);
      } else {
        highlightEdges(this.cy, result.mst, this.state.isDirected);

        this.showSuccess(
          result.algorithm,
          `
            <p><strong>Загальна вага:</strong> ${result.totalWeight.toFixed(2)}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Кількість вершин:</strong> ${result.nodeCount}</p>
            <p><strong>Оброблено ребер:</strong> ${result.processedEdges}</p>
          `
        );
      }
    });

    // A* Algorithm
    const runAStarButton = document.getElementById('runAStar');
    runAStarButton?.addEventListener('click', () => {
      const source = document.getElementById('sourceNode').value.trim();
      const target = document.getElementById('targetNode').value.trim();

      if (!source || !target) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ffa94d;">
            <h3>⚠️ Введіть вершини</h3>
            <p>Будь ласка, введіть вихідну та цільову вершини</p>
          </div>
        `;
        return;
      }

      const result = findPathAStar(this.cy, source, target, this.state.isDirected);

      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
      } else {
        highlightPath(this.cy, result.path, this.state.isDirected);
        const arrow = this.state.isDirected ? '→' : '—';

        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ ${result.algorithm}</h3>
            <p><strong>Від:</strong> ${source} <strong>До:</strong> ${target}</p>
            <p><strong>Відстань:</strong> ${result.distance.toFixed(2)}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Вершин досліджено:</strong> ${result.nodesExplored}</p>
            <p><strong>Евристика:</strong> ${result.heuristic}</p>
            <p><strong>Шлях:</strong> ${result.path.join(` ${arrow} `)}</p>
          </div>
        `;
      }
    });

    // Bellman-Ford Algorithm
    const runBellmanFordButton = document.getElementById('runBellmanFord');
    runBellmanFordButton?.addEventListener('click', () => {
      const source = document.getElementById('sourceNode').value.trim();
      const target = document.getElementById('targetNode').value.trim();

      if (!source || !target) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ffa94d;">
            <h3>⚠️ Введіть вершини</h3>
            <p>Будь ласка, введіть вихідну та цільову вершини</p>
          </div>
        `;
        return;
      }

      const result = findPathBellmanFord(this.cy, source, target, this.state.isDirected);

      if (result.error) {
        const color = result.negativeCycle ? '#ffa94d' : '#ff6b6b';
        const negativeCycleInfo = result.negativeCycle
          ? `<p><strong>⚠️ Виявлено від'ємний цикл!</strong></p>
             <p>Кількість ребер циклу: ${result.negativeCycleCount}</p>`
          : '';

        document.getElementById('info').innerHTML = `
          <div style="color: ${color};">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${negativeCycleInfo}
          </div>
        `;
      } else {
        highlightPath(this.cy, result.path, this.state.isDirected);
        const arrow = this.state.isDirected ? '→' : '—';

        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ ${result.algorithm}</h3>
            <p><strong>Від:</strong> ${source} <strong>До:</strong> ${target}</p>
            <p><strong>Відстань:</strong> ${result.distance.toFixed(2)}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Шлях:</strong> ${result.path.join(` ${arrow} `)}</p>
            <p><small>✓ Bellman-Ford може працювати з від'ємними вагами</small></p>
          </div>
        `;
      }
    });
  }

  setupUIToggleButtons() {
    // Акордеони для категорій
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
      // За замовчуванням всі секції відкриті
      header.classList.add('active');

      header.addEventListener('click', () => {
        const sectionId = header.getAttribute('data-section');
        const content = document.getElementById(`${sectionId}Content`);

        if (content) {
          // Перемикаємо стан
          header.classList.toggle('active');
          content.classList.toggle('collapsed');
        }
      });
    });

    // Спойлери всередині секцій
    const spoilerToggle = document.getElementById('spoilerToggle');
    const pathSpoilerContent = document.getElementById('pathSpoilerContent');
    spoilerToggle?.addEventListener('click', () => {
      if (pathSpoilerContent.style.display === 'none' || !pathSpoilerContent.style.display) {
        pathSpoilerContent.style.display = 'block';
      } else {
        pathSpoilerContent.style.display = 'none';
      }
    });

    const traversalSpoilerToggle = document.getElementById('traversalSpoilerToggle');
    const traversalSpoilerContent = document.getElementById('traversalSpoilerContent');
    traversalSpoilerToggle?.addEventListener('click', () => {
      if (traversalSpoilerContent.style.display === 'none' || !traversalSpoilerContent.style.display) {
        traversalSpoilerContent.style.display = 'block';
      } else {
        traversalSpoilerContent.style.display = 'none';
      }
    });

    const mstSpoilerToggle = document.getElementById('mstSpoilerToggle');
    const mstSpoilerContent = document.getElementById('mstSpoilerContent');
    mstSpoilerToggle?.addEventListener('click', () => {
      if (mstSpoilerContent.style.display === 'none' || !mstSpoilerContent.style.display) {
        mstSpoilerContent.style.display = 'block';
      } else {
        mstSpoilerContent.style.display = 'none';
      }
    });

    const rpClose = document.querySelector('.rpClose');
    const rightPanel = document.getElementById('rightPanel');
    const openAlgoPanel = document.getElementById('openAlgoPanel');

    // Закрити панель алгоритмів
    rpClose?.addEventListener('click', () => {
      rightPanel?.classList.add('hidden');
      openAlgoPanel?.classList.remove('hidden');
    });

    // Відкрити панель алгоритмів
    openAlgoPanel?.addEventListener('click', () => {
      rightPanel?.classList.remove('hidden');
      openAlgoPanel?.classList.add('hidden');
    });
  }

  setupGraphGenerator() {
    const modal = document.getElementById('graphGeneratorModal');
    const generateButton = document.getElementById('generateGraph');
    const closeButton = document.querySelector('.modal-close');
    const cancelButton = document.getElementById('cancelGenerate');
    const confirmButton = document.getElementById('confirmGenerate');
    const graphTypeSelect = document.getElementById('graphType');
    const nodeCountGroup = document.getElementById('nodeCountGroup');
    const bipartiteGroup = document.getElementById('bipartiteGroup');
    const edgeProbabilityGroup = document.getElementById('edgeProbabilityGroup');

    // Відкриття модального вікна
    generateButton?.addEventListener('click', () => {
      modal.classList.add('active');
    });

    // Закриття модального вікна
    const closeModal = () => {
      modal.classList.remove('active');
    };

    closeButton?.addEventListener('click', closeModal);
    cancelButton?.addEventListener('click', closeModal);

    // Закриття при кліку поза модальним вікном
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Зміна видимості полів в залежності від типу графа
    graphTypeSelect?.addEventListener('change', () => {
      const graphType = graphTypeSelect.value;

      // Приховуємо всі додаткові поля
      nodeCountGroup.style.display = 'block';
      bipartiteGroup.style.display = 'none';
      edgeProbabilityGroup.style.display = 'none';

      // Показуємо специфічні поля
      if (graphType === 'bipartite') {
        nodeCountGroup.style.display = 'none';
        bipartiteGroup.style.display = 'block';
      } else if (graphType === 'random') {
        edgeProbabilityGroup.style.display = 'block';
      }
    });

    // Генерація графа
    confirmButton?.addEventListener('click', () => {
      const graphType = document.getElementById('graphType').value;
      const nodeCount = parseInt(document.getElementById('nodeCount').value);
      const minWeight = parseInt(document.getElementById('minWeight').value);
      const maxWeight = parseInt(document.getElementById('maxWeight').value);
      const clearBefore = document.getElementById('clearBeforeGenerate').checked;

      // Показуємо індикатор завантаження для великих графів
      const overlay = document.getElementById('overlay');
      const shouldShowLoader = nodeCount >= 30;

      if (shouldShowLoader && overlay) {
        overlay.style.display = 'flex';
      }

      // Використовуємо setTimeout для великих графів, щоб UI встиг оновитися
      setTimeout(() => {
        // Очищення графа якщо потрібно
        if (clearBefore) {
          this.cy.elements().remove();
          this.state.nodeCount = 0;
        }

        try {
          let result;

        // Генерація графа в залежності від типу
        switch (graphType) {
          case 'complete':
            result = generateCompleteGraph(
              this.cy,
              nodeCount,
              this.state.isDirected,
              minWeight,
              maxWeight,
              this.state.gridSize,
              this.state
            );
            break;

          case 'tree':
            result = generateTree(
              this.cy,
              nodeCount,
              this.state.isDirected,
              minWeight,
              maxWeight,
              this.state.gridSize,
              this.state
            );
            break;

          case 'random':
            const edgeProbability = parseFloat(document.getElementById('edgeProbability').value);
            result = generateRandomGraph(
              this.cy,
              nodeCount,
              edgeProbability,
              this.state.isDirected,
              minWeight,
              maxWeight,
              this.state.gridSize,
              this.state
            );
            break;

          case 'cycle':
            result = generateCycle(
              this.cy,
              nodeCount,
              this.state.isDirected,
              minWeight,
              maxWeight,
              this.state.gridSize,
              this.state
            );
            break;

          case 'bipartite':
            const leftNodes = parseInt(document.getElementById('leftNodes').value);
            const rightNodes = parseInt(document.getElementById('rightNodes').value);
            result = generateBipartiteGraph(
              this.cy,
              leftNodes,
              rightNodes,
              this.state.isDirected,
              minWeight,
              maxWeight,
              this.state.gridSize,
              this.state
            );
            break;

          case 'star':
            result = generateStarGraph(
              this.cy,
              nodeCount,
              this.state.isDirected,
              minWeight,
              maxWeight,
              this.state.gridSize,
              this.state
            );
            break;

          default:
            this.showError(
              'Невідомий тип графа',
              '<p>Виберіть один з доступних типів</p>'
            );
            return;
        }

          // Успішна генерація
          // Оновлюємо стилі ребер
          this.updateEdgeStyle();

          // Зберігаємо в історію
          this.historyManager.saveHistory();

          // Показуємо інформацію про успіх
          document.getElementById('info').innerHTML = `
            <div style="color: #51cf66;">
              <h3>✓ Граф успішно згенеровано</h3>
              <p><strong>Тип:</strong> ${this.getGraphTypeName(graphType)}</p>
              <p><strong>Вершин:</strong> ${result.nodes}</p>
              <p><strong>Ребер:</strong> ${result.edges}</p>
              <p><strong>Орієнтований:</strong> ${this.state.isDirected ? 'Так' : 'Ні'}</p>
              ${result.message ? `<p><em>${result.message}</em></p>` : ''}
            </div>
          `;

          // Закриваємо модальне вікно
          closeModal();
        } catch (error) {
          document.getElementById('info').innerHTML = `
            <div style="color: #ff6b6b;">
              <h3>❌ Помилка при генерації графа</h3>
              <p>${error.message}</p>
            </div>
          `;
          console.error(error);
        } finally {
          // Приховуємо індикатор завантаження
          if (overlay) {
            overlay.style.display = 'none';
          }
        }
      }, shouldShowLoader ? 100 : 0);
    });
  }

  getGraphTypeName(type) {
    const types = {
      'complete': 'Повний граф',
      'tree': 'Дерево',
      'random': 'Випадковий граф',
      'cycle': 'Цикл',
      'bipartite': 'Двочастковий граф',
      'star': 'Зірка'
    };
    return types[type] || type;
  }
}
