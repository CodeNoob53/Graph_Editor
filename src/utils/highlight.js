export function clearHighlights(cy) {
  cy.elements().removeClass('highlighted');
}

export function highlightPath(cy, path) {
  clearHighlights(cy);
  path.forEach((nodeId, index) => {
    cy.$(`#${nodeId}`).addClass('highlighted');
    if (index < path.length - 1) {
      const edges = cy.edges().filter(edge => {
        const source = edge.data('source');
        const target = edge.data('target');
        return (
          (source === nodeId && target === path[index + 1]) ||
          (target === nodeId && source === path[index + 1])
        );
      });

      // Якщо є кілька ребер між вершинами, вибираємо з найменшою вагою
      if (edges.length > 0) {
        let minEdge = edges[0];
        let minWeight = parseFloat(edges[0].data('weight')) || 1;

        for (let i = 1; i < edges.length; i++) {
          const weight = parseFloat(edges[i].data('weight')) || 1;
          if (weight < minWeight) {
            minWeight = weight;
            minEdge = edges[i];
          }
        }

        minEdge.addClass('highlighted');
      }
    }
  });
}

export function highlightEdges(cy, mstEdges) {
  clearHighlights(cy);
  const nodesToHighlight = new Set();
  
  mstEdges.forEach(edgeInfo => {
    const edges = cy.edges().filter(e => {
      return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
        (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
    });
    
    // Якщо є кілька ребер між вершинами, вибираємо з найменшою вагою
    if (edges.length > 0) {
      let minEdge = edges[0];
      let minWeight = parseFloat(edges[0].data('weight')) || 1;

      for (let i = 1; i < edges.length; i++) {
        const weight = parseFloat(edges[i].data('weight')) || 1;
        if (weight < minWeight) {
          minWeight = weight;
          minEdge = edges[i];
        }
      }

      minEdge.addClass('highlighted');
    }
    
    nodesToHighlight.add(edgeInfo.source);
    nodesToHighlight.add(edgeInfo.target);
  });
  
  nodesToHighlight.forEach(nodeId => cy.$(`#${nodeId}`).addClass('highlighted'));
}

export function highlightNodesAndEdges(cy, nodes, edges) {
  clearHighlights(cy);
  nodes.forEach(nodeId => {
    cy.$(`#${nodeId}`).addClass('highlighted');
  });
  
  edges.forEach(edgeInfo => {
    const foundEdges = cy.edges().filter(e => {
      return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
        (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
    });
    
    // Якщо є кілька ребер між вершинами, вибираємо з найменшою вагою
    if (foundEdges.length > 0) {
      let minEdge = foundEdges[0];
      let minWeight = parseFloat(foundEdges[0].data('weight')) || 1;

      for (let i = 1; i < foundEdges.length; i++) {
        const weight = parseFloat(foundEdges[i].data('weight')) || 1;
        if (weight < minWeight) {
          minWeight = weight;
          minEdge = foundEdges[i];
        }
      }

      minEdge.addClass('highlighted');
    }
  });
}
