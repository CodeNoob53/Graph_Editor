/**
 * HistoryManager - клас для управління історією змін (undo/redo)
 */
class HistoryManager {
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Збереження поточного стану
   */
  saveState() {
    const currentState = this.graphManager.getState();
    this.undoStack.push(currentState);
    this.redoStack = [];
  }

  /**
   * Відміна останньої дії
   */
  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.graphManager.getState();
      this.redoStack.push(currentState);

      this.undoStack.pop();
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.graphManager.restoreState(previousState);

      return true;
    }
    return false;
  }

  /**
   * Повернення скасованої дії
   */
  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop();
      const currentState = this.graphManager.getState();
      this.undoStack.push(currentState);

      this.graphManager.restoreState(nextState);

      return true;
    }
    return false;
  }

  /**
   * Перевірка можливості відміни
   */
  canUndo() {
    return this.undoStack.length > 1;
  }

  /**
   * Перевірка можливості повернення
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Очищення історії
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
