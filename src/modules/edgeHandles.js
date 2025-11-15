export class EdgeManager {
  constructor(cy, state) {
    this.cy = cy;
    this.state = state;
    this.edgeHandles = null;

    this.init();
  }

  init() {
    this.edgeHandles = this.cy.edgehandles({
      edgeType: () => 'flat',
      complete: (_sourceNode, _targetNode, addedEles) => {
        this.handleEdgeComplete(addedEles);
      }
    });

    this.edgeHandles.edgeParams = (sourceNode, targetNode) => {
      return this.validateEdge(sourceNode, targetNode);
    };
  }

  handleEdgeComplete(addedEles) {
    const tempNodes = addedEles.filter(ele => ele.isNode() && ele.hasClass('eh-preview'));
    tempNodes.forEach(node => {
      this.cy.remove(node);
    });
  }

  validateEdge(sourceNode, targetNode) {
    if (sourceNode.id() === targetNode.id()) {
      return null;
    }

    const existingEdge = this.cy.edges().some(edge =>
      (edge.source().id() === sourceNode.id() && edge.target().id() === targetNode.id()) ||
      (edge.source().id() === targetNode.id() && edge.target().id() === sourceNode.id())
    );

    if (existingEdge) {
      return null;
    }

    return { data: { source: sourceNode.id(), target: targetNode.id() } };
  }

  enableDrawMode() {
    this.edgeHandles?.enableDrawMode();
  }

  disableDrawMode() {
    this.edgeHandles?.disableDrawMode();
  }

  getEdgeHandles() {
    return this.edgeHandles;
  }
}
