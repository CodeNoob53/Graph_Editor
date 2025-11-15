export class HistoryManager {
  constructor(cy) {
    this.cy = cy;
    this.undoStack = [];
    this.redoStack = [];
  }

  saveHistory() {
    const currentState = JSON.parse(JSON.stringify(this.cy.json()));

    const elements = currentState.elements || { nodes: [], edges: [] };
    const nodes = elements.nodes || [];
    const edges = elements.edges || [];

    const filteredNodes = nodes.filter(node => {
      const classes = node.classes || '';
      return !classes.includes('eh-ghost') && !classes.includes('eh-preview-active');
    });

    const filteredEdges = edges.filter(edge => {
      const classes = edge.classes || '';
      return !classes.includes('eh-ghost') && !classes.includes('eh-ghost-edge');
    });

    const newState = { elements: { nodes: filteredNodes, edges: filteredEdges } };
    this.undoStack.push(newState);
    this.redoStack = [];

    console.log('Saving History:');
    console.log('Filtered Nodes:', filteredNodes);
    console.log('Filtered Edges:', filteredEdges);
  }

  undo() {
    if (this.undoStack.length > 1) {
      console.log('Undo operation triggered');

      const currentState = JSON.parse(JSON.stringify(this.cy.json()));
      this.redoStack.push(currentState);

      const previousState = this.undoStack.pop();
      this.cy.elements().remove();
      this.cy.json(previousState);
    } else {
      console.log('Undo operation skipped: Not enough history.');
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      console.log('Redo operation triggered');

      const currentState = JSON.parse(JSON.stringify(this.cy.json()));
      this.undoStack.push(currentState);

      const nextState = this.redoStack.pop();
      this.cy.elements().remove();
      this.cy.json(nextState);
    } else {
      console.log('Redo operation skipped: Nothing to redo.');
    }
  }
}
