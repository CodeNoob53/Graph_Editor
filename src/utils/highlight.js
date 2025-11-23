// Зберігаємо активні тайм-аути для можливості їх скасування
let activeTimeouts = [];
const ANIMATION_STEP_DELAY = 100;

export function clearHighlights(cy) {
  // Скасовуємо всі заплановані анімації
  activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  activeTimeouts = [];

  // Видаляємо клас підсвітки з усіх елементів
  cy.elements().removeClass('highlighted');
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
