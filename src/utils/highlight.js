export function clearHighlights(cy) {
  cy.elements().removeClass('highlighted');
}

export function highlightPath(cy, path, edgeIds = null) {
  clearHighlights(cy);

  // Використовуємо batch тільки якщо метод доступний
  const supportsBatch = typeof cy.startBatch === 'function';
  if (supportsBatch) cy.startBatch();

  path.forEach((nodeId, index) => {
    // Використовуємо cy.getElementById() замість cy.$() для кращої продуктивності
    cy.getElementById(nodeId).addClass('highlighted');

    if (index < path.length - 1) {
      // Якщо передано масив ID ребер, використовуємо його
      if (edgeIds && edgeIds[index]) {
        const edge = cy.getElementById(edgeIds[index]);
        if (edge && edge.length > 0) {
          edge.addClass('highlighted');
          return;
        }
      }

      // Інакше шукаємо ребро з мінімальною вагою між вершинами
      const edges = cy.edges().filter(edge => {
        const source = edge.data('source');
        const target = edge.data('target');
        return (
          (source === nodeId && target === path[index + 1]) ||
          (target === nodeId && source === path[index + 1])
        );
      });

      // Якщо знайдено ребра
      if (edges.length > 0) {
        // Якщо кілька ребер, підсвічуємо тільки з мінімальною вагою
        if (edges.length > 1) {
          let minEdge = null;
          let minWeight = Infinity;

          edges.forEach(e => {
            const weight = parseFloat(e.data('weight')) || Infinity;
            if (weight < minWeight) {
              minWeight = weight;
              minEdge = e;
            }
          });

          if (minEdge) {
            cy.getElementById(minEdge.id()).addClass('highlighted');
          }
        } else {
          edges.addClass('highlighted');
        }
      }
    }
  });

  if (supportsBatch) cy.endBatch();
}

export function highlightEdges(cy, mstEdges) {
  clearHighlights(cy);

  const supportsBatch = typeof cy.startBatch === 'function';
  if (supportsBatch) cy.startBatch();

  const nodesToHighlight = new Set();
  mstEdges.forEach(edgeInfo => {
    let edge;

    // Якщо є edgeId, використовуємо його для точної ідентифікації
    if (edgeInfo.edgeId) {
      edge = cy.getElementById(edgeInfo.edgeId);
    } else {
      // Інакше шукаємо по source/target (старий спосіб)
      edge = cy.edges().filter(e => {
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });
    }

    if (edge && edge.length > 0) {
      edge.addClass('highlighted');
      nodesToHighlight.add(edgeInfo.source);
      nodesToHighlight.add(edgeInfo.target);
    }
  });

  // Використовуємо cy.getElementById() замість cy.$()
  nodesToHighlight.forEach(nodeId => cy.getElementById(nodeId).addClass('highlighted'));

  if (supportsBatch) cy.endBatch();
}

export function highlightNodesAndEdges(cy, nodes, edges) {
  clearHighlights(cy);

  const supportsBatch = typeof cy.startBatch === 'function';
  if (supportsBatch) cy.startBatch();

  // Використовуємо cy.getElementById() замість cy.$()
  nodes.forEach(nodeId => {
    cy.getElementById(nodeId).addClass('highlighted');
  });

  edges.forEach(edgeInfo => {
    let edge;

    // Якщо є edgeId, використовуємо його для точної ідентифікації
    if (edgeInfo.edgeId) {
      edge = cy.getElementById(edgeInfo.edgeId);
    } else {
      // Інакше шукаємо по source/target
      edge = cy.edges().filter(e => {
        return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
          (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
      });
    }

    if (edge && edge.length > 0) {
      edge.addClass('highlighted');
    }
  });

  if (supportsBatch) cy.endBatch();
}
