export function clearHighlights(cy) {
  cy.elements().removeClass('highlighted');
}

export function highlightPath(cy, path) {
  clearHighlights(cy);
  path.forEach((nodeId, index) => {
    cy.$(`#${nodeId}`).addClass('highlighted');
    if (index < path.length - 1) {
      const edge = cy.edges().filter(edge => {
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

export function highlightEdges(cy, mstEdges) {
  clearHighlights(cy);
  const nodesToHighlight = new Set();
  mstEdges.forEach(edgeInfo => {
    const edge = cy.edges().filter(e => {
      return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
        (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
    });
    edge.addClass('highlighted');
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
    const edge = cy.edges().filter(e => {
      return (e.data('source') === edgeInfo.source && e.data('target') === edgeInfo.target) ||
        (e.data('source') === edgeInfo.target && e.data('target') === edgeInfo.source);
    });
    edge.addClass('highlighted');
  });
}
