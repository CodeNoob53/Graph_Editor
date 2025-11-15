export class HistoryManager {
  constructor(cy) {
    this.cy = cy;
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 50;
  }

  /**
   * Отримати мінімальний стан графа (тільки важливі дані)
   */
  getMinimalState() {
    const nodes = this.cy.nodes().map(node => {
      const classes = node.classes();
      // Пропускаємо тимчасові вершини
      if (classes.includes('eh-ghost') || classes.includes('eh-preview-active')) {
        return null;
      }

      return {
        data: {
          id: node.id()
        },
        position: {
          x: node.position().x,
          y: node.position().y
        }
      };
    }).filter(node => node !== null);

    const edges = this.cy.edges().map(edge => {
      const classes = edge.classes();
      // Пропускаємо тимчасові ребра
      if (classes.includes('eh-ghost') || classes.includes('eh-ghost-edge') || classes.includes('eh-preview')) {
        return null;
      }

      const edgeData = {
        data: {
          id: edge.id(),
          source: edge.source().id(),
          target: edge.target().id()
        }
      };

      // Додаємо вагу тільки якщо вона є
      const weight = edge.data('weight');
      if (weight !== undefined && weight !== null && weight !== '') {
        edgeData.data.weight = weight;
      }

      return edgeData;
    }).filter(edge => edge !== null);

    return {
      nodes,
      edges
    };
  }

  /**
   * Застосувати збережений стан до графа
   */
  applyState(state) {
    // Видаляємо всі елементи
    this.cy.elements().remove();

    // Додаємо вершини
    if (state.nodes && state.nodes.length > 0) {
      this.cy.add(state.nodes);
    }

    // Додаємо ребра
    if (state.edges && state.edges.length > 0) {
      this.cy.add(state.edges);
    }
  }

  /**
   * Перевірити чи відрізняються два стани
   */
  statesAreDifferent(state1, state2) {
    if (!state1 || !state2) return true;

    const json1 = JSON.stringify(state1);
    const json2 = JSON.stringify(state2);

    return json1 !== json2;
  }

  /**
   * Зберегти поточний стан в історію
   */
  saveHistory() {
    const newState = this.getMinimalState();

    // Не зберігаємо якщо стан не змінився
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack[this.undoStack.length - 1];
      if (!this.statesAreDifferent(newState, lastState)) {
        return;
      }
    }

    // Обмежуємо розмір стеку
    if (this.undoStack.length >= this.maxStackSize) {
      this.undoStack.shift();
    }

    this.undoStack.push(newState);
    this.redoStack = [];
  }

  /**
   * Скасувати останню дію
   */
  undo() {
    if (this.undoStack.length <= 1) {
      return;
    }

    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);

    const previousState = this.undoStack[this.undoStack.length - 1];
    this.applyState(previousState);
  }

  /**
   * Повторити скасовану дію
   */
  redo() {
    if (this.redoStack.length === 0) {
      return;
    }

    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);

    this.applyState(nextState);
  }

  /**
   * Очистити історію
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Отримати кількість доступних undo операцій
   */
  getUndoCount() {
    return Math.max(0, this.undoStack.length - 1);
  }

  /**
   * Отримати кількість доступних redo операцій
   */
  getRedoCount() {
    return this.redoStack.length;
  }
}
