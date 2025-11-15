export class KeyboardManager {
  constructor(cy, state, historyManager) {
    this.cy = cy;
    this.state = state;
    this.historyManager = historyManager;

    this.init();
  }

  init() {
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ігноруємо якщо фокус на input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl+Z - Undo (використовуємо e.code для незалежності від мови)
      if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        this.historyManager.undo();
      }

      // Ctrl+Y або Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.code === 'KeyY') || (e.ctrlKey && e.shiftKey && e.code === 'KeyZ')) {
        e.preventDefault();
        this.historyManager.redo();
      }

      // Delete або Backspace - видалити вибрані елементи
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const selected = this.cy.$(':selected');
        if (selected.length > 0) {
          e.preventDefault();
          selected.remove();
          this.historyManager.saveHistory();
        }
      }

      // Escape - скасувати виділення
      if (e.code === 'Escape') {
        this.cy.$(':selected').unselect();
        this.cy.elements().removeClass('active-node');
        this.cy.elements().removeClass('active-edge');
      }

      // Ctrl+A - вибрати всі елементи
      if (e.ctrlKey && e.code === 'KeyA') {
        e.preventDefault();
        this.cy.elements().select();
      }
    });
  }
}
