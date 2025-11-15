export function initEdgeHandles(cy, state) {
  const eh = cy.edgehandles({
    edgeType: () => 'flat',
    complete: (_sourceNode, _targetNode, addedEles) => {
      const tempNodes = addedEles.filter(ele => ele.isNode() && ele.hasClass('eh-preview'));
      tempNodes.forEach(node => {
        console.log('Removing temporary node:', node.id());
        cy.remove(node);
      });

      const finalEdges = addedEles.filter(ele => ele.isEdge());
      finalEdges.forEach(edge => {
        console.log('Final edge created:', edge.data());
      });
    }
  });

  eh.edgeParams = (sourceNode, targetNode) => {
    if (sourceNode.id() === targetNode.id()) {
      console.log('Self-loops are not allowed.');
      return null;
    }

    const existingEdge = cy.edges().some(edge =>
      (edge.source().id() === sourceNode.id() && edge.target().id() === targetNode.id()) ||
      (edge.source().id() === targetNode.id() && edge.target().id() === sourceNode.id())
    );

    if (existingEdge) {
      console.log('Duplicate edges are not allowed.');
      return null;
    }

    return { data: { source: sourceNode.id(), target: targetNode.id() } };
  };

  return eh;
}
