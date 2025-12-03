// Зберігаємо активні тайм-аути для можливості їх скасування
let activeTimeouts = [];
const ANIMATION_STEP_DELAY = 100;

export function clearHighlights(cy) {
  // Скасовуємо всі заплановані анімації
  activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  activeTimeouts = [];

  // Видаляємо клас підсвітки з усіх елементів
  cy.elements().removeClass('highlighted dimmed processed ready');

  // Скидаємо стилі, які могли бути змінені анімацією (PageRank)
  cy.nodes().stop(true, true); // Зупиняємо анімації
  cy.nodes().removeStyle('width height background-opacity label background-color border-width border-color');
  cy.nodes().style({ 'label': (ele) => ele.id() }); // Відновлюємо дефолтний лейбл
}

function addTimeout(callback, delay) {
  const timeoutId = setTimeout(callback, delay);
  activeTimeouts.push(timeoutId);
  return timeoutId;
}

export function highlightPath(cy, path, isDirected = false) {
  clearHighlights(cy);

  if (!path || path.length === 0) return;

  let currentDelay = 0;

  path.forEach((nodeId, index) => {
    // Підсвічуємо вершину
    addTimeout(() => {
      cy.$(`#${nodeId}`).addClass('highlighted');
    }, currentDelay);

    currentDelay += ANIMATION_STEP_DELAY;

    // Якщо це не остання вершина, шукаємо і підсвічуємо ребро до наступної
    if (index < path.length - 1) {
      const nextNodeId = path[index + 1];

      addTimeout(() => {
        const edges = cy.edges().filter(edge => {
          const source = edge.data('source');
          const target = edge.data('target');

          // Для орієнтованого графа: тільки ребра у правильному напрямку
          if (isDirected) {
            return source === nodeId && target === nextNodeId;
          }
          // Для неорієнтованого: обидва напрямки
          return (
            (source === nodeId && target === nextNodeId) ||
            (target === nodeId && source === nextNodeId)
          );
        });

        // Якщо є кілька ребер між вершинами, вибираємо з найменшою вагою
        if (edges.length > 0) {
          let minEdge = edges.first();
          let minWeight = parseFloat(minEdge.data('weight')) || 1;

          edges.forEach((edge) => {
            const weight = parseFloat(edge.data('weight')) || 1;
            if (weight < minWeight) {
              minWeight = weight;
              minEdge = cy.getElementById(edge.id());
            }
          });

          minEdge.addClass('highlighted');
        }
      }, currentDelay);

      currentDelay += ANIMATION_STEP_DELAY;
    }
  });
}

export function highlightEdges(cy, mstEdges, isDirected = false) {
  clearHighlights(cy);
  const nodesToHighlight = new Set();

  let currentDelay = 0;

  mstEdges.forEach(edgeInfo => {
    addTimeout(() => {
      const edges = cy.edges().filter(e => {
        // Для орієнтованого графа: тільки ребра у правильному напрямку
        if (isDirected) {
          return e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target;
        }
        // Для неорієнтованого: обидва напрямки
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });

      // Якщо є кілька ребер між вершинами, вибираємо з найменшою вагою
      if (edges.length > 0) {
        let minEdge = edges.first();
        let minWeight = parseFloat(minEdge.data('weight')) || 1;

        edges.forEach((edge) => {
          const weight = parseFloat(edge.data('weight')) || 1;
          if (weight < minWeight) {
            minWeight = weight;
            minEdge = cy.getElementById(edge.id());
          }
        });

        minEdge.addClass('highlighted');

        // Також підсвічуємо вершини, які з'єднує це ребро
        cy.$(`#${edgeInfo.source}`).addClass('highlighted');
        cy.$(`#${edgeInfo.target}`).addClass('highlighted');
      }
    }, currentDelay);

    currentDelay += ANIMATION_STEP_DELAY;
  });
}

export function highlightNodesAndEdges(cy, nodes, edges, isDirected = false) {
  clearHighlights(cy);

  if (!nodes || nodes.length === 0) return;

  let currentDelay = 0;

  // Підсвічуємо першу вершину
  addTimeout(() => {
    cy.$(`#${nodes[0]}`).addClass('highlighted');
  }, currentDelay);

  currentDelay += ANIMATION_STEP_DELAY;

  // Далі йдемо парами: ребро -> вершина
  // edges[i] веде до nodes[i+1]
  for (let i = 0; i < edges.length; i++) {
    const edgeInfo = edges[i];
    const nextNodeId = nodes[i + 1];

    // Підсвічуємо ребро
    addTimeout(() => {
      const foundEdges = cy.edges().filter(e => {
        if (isDirected) {
          return e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target;
        }
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });

      if (foundEdges.length > 0) {
        let minEdge = foundEdges.first();
        let minWeight = parseFloat(minEdge.data('weight')) || 1;

        foundEdges.forEach((edge) => {
          const weight = parseFloat(edge.data('weight')) || 1;
          if (weight < minWeight) {
            minWeight = weight;
            minEdge = cy.getElementById(edge.id());
          }
        });

        minEdge.addClass('highlighted');
      }
    }, currentDelay);

    currentDelay += ANIMATION_STEP_DELAY;

    // Підсвічуємо наступну вершину
    if (nextNodeId) {
      addTimeout(() => {
        cy.$(`#${nextNodeId}`).addClass('highlighted');
      }, currentDelay);

      currentDelay += ANIMATION_STEP_DELAY;
    }
  }
}

export function animatePageRank(cy, steps) {
  clearHighlights(cy);
  let currentDelay = 0;
  const STEP_DELAY = 500; // Повільніше для PageRank

  steps.forEach(step => {
    addTimeout(() => {
      if (step.type === 'iteration' || step.type === 'init' || step.type === 'normalize') {
        const ranks = step.ranks;

        // Знаходимо максимальний ранг для масштабування
        const maxRank = Math.max(...Object.values(ranks));

        cy.nodes().forEach(node => {
          const rank = ranks[node.id()] || 0;
          const normalizedRank = maxRank > 0 ? rank / maxRank : 0;

          // Змінюємо розмір та колір вершини залежно від рангу
          const size = 30 + (normalizedRank * 50); // від 30px до 80px
          const opacity = 0.4 + (normalizedRank * 0.6); // від 0.4 до 1.0

          // Встановлюємо текстові властивості окремо (вони не анімуються)
          node.style({
            'label': `${node.id()}\n${(rank * 100).toFixed(2)}%`,
            'text-wrap': 'wrap',
            'color': '#ffffff',
            'text-outline-color': '#000000',
            'text-outline-width': 2,
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px', // Фіксований розмір шрифту
            'text-line-height': 1.5 // Збільшений інтервал між рядками
          });

          // Анімуємо геометричні властивості
          node.animate({
            style: {
              'width': size,
              'height': size,
              'background-opacity': opacity
            }
          }, {
            duration: STEP_DELAY / 2
          });
        });
      }
    }, currentDelay);

    currentDelay += STEP_DELAY;
  });
}

export function animateTopologicalSort(cy, steps) {
  clearHighlights(cy);
  let currentDelay = 0;
  const STEP_DELAY = 800;

  // Скидаємо стилі перед початком
  cy.elements().removeClass('highlighted dimmed processed ready');
  cy.nodes().style({ 'label': (ele) => ele.id() }); // Скидаємо лейбли

  steps.forEach(step => {
    addTimeout(() => {
      if (step.type === 'init') {
        // Показуємо початкові вхідні степені
        cy.nodes().forEach(node => {
          const degree = step.inDegrees[node.id()];
          node.style('label', `${node.id()} (in: ${degree})`);
        });
      } else if (step.type === 'ready-nodes') {
        // Підсвічуємо вершини з 0 вхідним степенем
        cy.nodes().removeClass('ready');
        step.nodes.forEach(nodeId => {
          cy.getElementById(nodeId).addClass('ready');
        });
      } else if (step.type === 'select-node') {
        // Вершина вибрана і додана в сортування
        const node = cy.getElementById(step.node);
        node.removeClass('ready').addClass('processed');

        // Анімація "переміщення" або просто підсвітка
        node.animate({
          style: {
            'background-color': '#4dabf7',
            'border-width': 4,
            'border-color': '#1864ab'
          }
        }, { duration: 300 });

      } else if (step.type === 'update-degrees') {
        // Оновлюємо лейбли з новими степенями
        const inDegrees = step.inDegrees;
        cy.nodes().forEach(node => {
          if (inDegrees[node.id()] !== undefined) {
            // Тільки якщо вершина ще не оброблена
            if (!step.removedEdges.includes(node.id())) {
              node.style('label', `${node.id()} (in: ${inDegrees[node.id()]})`);
            }
          }
        });

        // "Видаляємо" ребра (робимо напівпрозорими)
        step.removedEdges.forEach(edgeId => {
          cy.getElementById(edgeId).addClass('dimmed');
        });

        // Підсвічуємо нові готові вершини
        step.newReadyNodes.forEach(nodeId => {
          cy.getElementById(nodeId).addClass('ready');
        });
      }
    }, currentDelay);

    currentDelay += STEP_DELAY;
  });
}
