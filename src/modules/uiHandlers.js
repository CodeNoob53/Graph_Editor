import { calculatePrimMST } from '../algorithms/mst.js';
import { findShortestPath } from '../algorithms/shortestPath.js';
import { findMinWeightedPathForFourVertices } from '../algorithms/minWeightedPath.js';
import { generateAllSpanningTrees } from '../algorithms/spanningTrees.js';
import { findEulerTrailAndCircuit } from '../algorithms/euler.js';
import { findHamiltonianCycles } from '../algorithms/hamiltonian.js';
import { findMaxFlowEdmondsKarp } from '../algorithms/edmondsKarp.js';
import { depthFirstSearch, breadthFirstSearch, checkConnectivity, detectCycle } from '../algorithms/traversal.js';
import { highlightPath, highlightEdges, highlightNodesAndEdges, clearHighlights } from '../utils/highlight.js';
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

  init() {
    this.setupModeButtons();
    this.setupGraphButtons();
    this.setupHistoryButtons();
    this.setupImportExportButtons();
    this.setupAlgorithmButtons();
    this.setupUIToggleButtons();
    this.setupGraphGenerator();
    this.setupLayoutControls();
  }

  setupLayoutControls() {
    const layoutSelect = document.getElementById('layoutSelect');
    layoutSelect?.addEventListener('change', () => {
      const layoutName = layoutSelect.value;
      this.applyLayout(layoutName);
    });
  }

  applyLayout(name) {
    let options = {
      name: name,
      animate: true,
      animationDuration: 500,
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
        options = {
          ...options,
          idealEdgeLength: 150,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 30,
          randomize: false,
          componentSpacing: 150,
          nodeRepulsion: 1000000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0
        };
        break;
      case 'circle':
        options = {
          ...options,
          radius: Math.min(400, Math.max(200, this.cy.nodes().length * 30))
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
      const info = `
        <h3>Graph Information</h3>
        <p>Nodes: ${nodes.length}</p>
        <p>Edges: ${edges.length}</p>
        <p>Type: ${this.state.isDirected ? 'Directed' : 'Undirected'}</p>
      `;
      document.getElementById('info').innerHTML = info;
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
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
      } else {
        highlightEdges(this.cy, result.mst, this.state.isDirected);
        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ Мінімальне остовне дерево (MST)</h3>
            <p><strong>Загальна вага:</strong> ${result.totalWeight}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Кількість вершин:</strong> ${result.nodeCount}</p>
          </div>
        `;
      }
    });

    const findPathButton = document.getElementById('findPath');
    findPathButton?.addEventListener('click', () => {
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

      const result = findShortestPath(this.cy, source, target, this.state.isDirected);
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
            <h3>✓ Найкоротший шлях (${result.graphType})</h3>
            <p><strong>Від:</strong> ${source} <strong>До:</strong> ${target}</p>
            <p><strong>Відстань:</strong> ${result.distance}</p>
            <p><strong>Кількість ребер:</strong> ${result.edgeCount}</p>
            <p><strong>Шлях:</strong> ${result.path.join(` ${arrow} `)}</p>
          </div>
        `;
      }
    });

    const runMaxFlowButton = document.getElementById('runMaxFlow');
    runMaxFlowButton?.addEventListener('click', () => {
      const source = document.getElementById('sourceNode').value.trim();
      const target = document.getElementById('targetNode').value.trim();

      if (!source || !target) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ffa94d;">
            <h3>⚠️ Введіть вершини</h3>
            <p>Будь ласка, введіть вихідну та цільову вершини (Source/Sink)</p>
          </div>
        `;
        return;
      }

      const result = findMaxFlowEdmondsKarp(this.cy, source, target);

      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
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

        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ Максимальний потік (Edmonds-Karp)</h3>
            <p><strong>Витік:</strong> ${source} <strong>Стік:</strong> ${target}</p>
            <p><strong>Значення потоку:</strong> ${result.maxFlow}</p>
            <div style="margin-top: 10px; padding: 10px; background: rgba(81, 207, 102, 0.1); border-radius: 4px;">
              <p><strong>Деталі потоку:</strong></p>
              <p style="font-family: monospace; font-size: 0.9em;">${flowList || 'Потік відсутній'}</p>
            </div>
          </div>
        `;
      }
    });

    const findMinPathButton = document.getElementById('findMinPath');
    findMinPathButton?.addEventListener('click', () => {
      const result = findMinWeightedPathForFourVertices(this.cy, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.checkedCombinations ? `<p><small>Перевірено комбінацій: ${result.checkedCombinations}</small></p>` : ''}
          </div>
        `;
      } else {
        highlightNodesAndEdges(this.cy, result.bestFullPath || result.bestPath,
          result.bestEdges || result.bestPath.slice(1).map((node, i) => ({
            source: result.bestPath[i],
            target: node
          })),
          this.state.isDirected
        );
        document.getElementById('info').innerHTML = result.formattedMessage;
        if (window.MathJax) {
          window.MathJax.typeset();
        }
      }
    });

    const listSpanningTreesButton = document.getElementById('listSpanningTrees');
    listSpanningTreesButton?.addEventListener('click', () => {
      const result = generateAllSpanningTrees(this.cy, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.checkedCombinations ? `<p><small>Перевірено комбінацій: ${result.checkedCombinations}</small></p>` : ''}
          </div>
        `;
      } else {
        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ Всі остовні дерева</h3>
            <p><strong>Знайдено дерев:</strong> ${result.count}</p>
            <p><strong>Вершин в графі:</strong> ${result.nodeCount}</p>
            <p><strong>Ребер в кожному дереві:</strong> ${result.edgesPerTree}</p>
            <p><small>Перевірено комбінацій: ${result.totalCombinations}</small></p>
          </div>
        `;
      }
    });

    const eulerCalculationButton = document.getElementById('eulerCalculation');
    eulerCalculationButton?.addEventListener('click', () => {
      const result = findEulerTrailAndCircuit(this.cy, this.state.isDirected);
      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.stats ? `<p><small>Тип графу: ${result.graphType}</small></p>` : ''}
          </div>
        `;
      } else {
        const icon = result.type === 'circuit' ? '🔄' : '📍';
        const typeLabel = result.type === 'circuit' ? 'Ейлерів цикл' : 'Ейлерів шлях';
        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>✓ ${icon} ${typeLabel}</h3>
            <p><strong>Результат:</strong> ${result.message}</p>
            <p>${result.details}</p>
            <p><small>Тип графу: ${result.graphType}</small></p>
          </div>
        `;
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
          document.getElementById('info').innerHTML = `
            <div style="color: #ff6b6b;">
              <h3>❌ ${result.error}</h3>
              <p>${result.details}</p>
              ${result.stats ? `<p><small>Тип графу: ${result.graphType}</small></p>` : ''}
            </div>
          `;
        } else {
          const cyclesList = result.formattedCycles.join('<br>');
          const additionalInfo = result.additionalCycles > 0
            ? `<p><small>...та ще ${result.additionalCycles} циклів</small></p>`
            : '';

          document.getElementById('info').innerHTML = `
            <div style="color: #51cf66;">
              <h3>✓ 🔄 Гамільтонові цикли</h3>
              <p><strong>Знайдено циклів:</strong> ${result.count}</p>
              <p><strong>Довжина циклу:</strong> ${result.stats.cycleLength} вершин</p>
              <p><strong>Перші ${result.showingFirst} циклів:</strong></p>
              <p style="font-family: monospace; font-size: 0.9em;">${cyclesList}</p>
              ${additionalInfo}
              <p><small>Тип графу: ${result.graphType}</small></p>
            </div>
          `;
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
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.availableNodes ? `<p><small>Доступні вершини: ${result.availableNodes.join(', ')}</small></p>` : ''}
          </div>
        `;
      } else {
        const arrow = this.state.isDirected ? '→' : '—';
        const completeness = result.isComplete
          ? '✓ Обхід повний (всі вершини відвідані)'
          : `⚠️ Обхід неповний (відвідано ${result.visitedCount} з ${result.totalNodes} вершин)`;

        // Підсвічуємо вершини та ребра обходу
        highlightNodesAndEdges(this.cy, result.traversalOrder, result.traversalEdges, this.state.isDirected);

        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>🔍 ${result.algorithm}</h3>
            <p><strong>Початкова вершина:</strong> ${result.startNode}</p>
            <p><strong>Порядок обходу:</strong> ${result.traversalOrder.join(` ${arrow} `)}</p>
            <p><strong>Відвідано вершин:</strong> ${result.visitedCount} / ${result.totalNodes}</p>
            <p>${completeness}</p>
            <p><small>Тип графу: ${result.graphType}</small></p>
          </div>
        `;
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
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
            ${result.availableNodes ? `<p><small>Доступні вершини: ${result.availableNodes.join(', ')}</small></p>` : ''}
          </div>
        `;
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

        document.getElementById('info').innerHTML = `
          <div style="color: #51cf66;">
            <h3>🔍 ${result.algorithm}</h3>
            <p><strong>Початкова вершина:</strong> ${result.startNode}</p>
            <p><strong>Порядок обходу:</strong> ${result.traversalOrder.join(` ${arrow} `)}</p>
            <p><strong>Відвідано вершин:</strong> ${result.visitedCount} / ${result.totalNodes}</p>
            <p><strong>Максимальний рівень:</strong> ${result.maxLevel}</p>
            <p>${completeness}</p>
            <div style="margin-top: 10px; padding: 10px; background: rgba(81, 207, 102, 0.1); border-radius: 4px;">
              <p><strong>Розподіл по рівнях:</strong></p>
              <p style="font-family: monospace; font-size: 0.9em;">${levelsList}</p>
            </div>
            <p><small>Тип графу: ${result.graphType}</small></p>
          </div>
        `;
      }
    });

    // Check Connectivity
    const checkConnectivityButton = document.getElementById('checkConnectivity');
    checkConnectivityButton?.addEventListener('click', () => {
      const result = checkConnectivity(this.cy, this.state.isDirected);

      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
      } else {
        const icon = result.isConnected ? '✓' : '❌';
        const color = result.isConnected ? '#51cf66' : '#ffa94d';

        let componentsInfo = '';
        if (!result.isConnected && result.componentsList) {
          componentsInfo = `
            <div style="margin-top: 10px; padding: 10px; background: rgba(255, 169, 77, 0.1); border-radius: 4px;">
              <p><strong>Компоненти зв'язності:</strong></p>
              ${result.componentsList.map((comp, i) =>
            `<p style="font-family: monospace; font-size: 0.9em;">Компонента ${i + 1}: {${comp.join(', ')}}</p>`
          ).join('')}
            </div>
          `;
        }

        document.getElementById('info').innerHTML = `
          <div style="color: ${color};">
            <h3>${icon} Перевірка зв'язності</h3>
            <p><strong>Результат:</strong> ${result.message}</p>
            <p><strong>Кількість вершин:</strong> ${result.totalNodes}</p>
            <p><strong>Кількість компонент:</strong> ${result.components}</p>
            ${componentsInfo}
          </div>
        `;
      }
    });

    // Detect Cycle
    const detectCycleButton = document.getElementById('detectCycle');
    detectCycleButton?.addEventListener('click', () => {
      const result = detectCycle(this.cy, this.state.isDirected);

      if (result.error) {
        document.getElementById('info').innerHTML = `
          <div style="color: #ff6b6b;">
            <h3>❌ ${result.error}</h3>
            <p>${result.details}</p>
          </div>
        `;
      } else {
        const icon = result.hasCycle ? '🔄' : '✓';
        const color = result.hasCycle ? '#ffa94d' : '#51cf66';

        document.getElementById('info').innerHTML = `
          <div style="color: ${color};">
            <h3>${icon} Виявлення циклів</h3>
            <p><strong>Результат:</strong> ${result.message}</p>
            <p><strong>Тип графу:</strong> ${result.graphType}</p>
            ${result.hasCycle ? '<p>⚠️ Граф містить один або більше циклів</p>' : '<p>✓ Граф не містить циклів</p>'}
          </div>
        `;
      }
    });
  }

  setupUIToggleButtons() {
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
            document.getElementById('info').innerHTML = `
              <div style="color: #ff6b6b;">
                <h3>❌ Невідомий тип графа</h3>
                <p>Виберіть один з доступних типів</p>
              </div>
            `;
            return;
        }

        // Перевірка результату
        if (result && result.error) {
          // Показуємо помилку
          document.getElementById('info').innerHTML = `
            <div style="color: #ff6b6b;">
              <h3>❌ ${result.error}</h3>
              <p>${result.details}</p>
            </div>
          `;
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
      }
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
