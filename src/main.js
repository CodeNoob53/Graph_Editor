/**
 * main.js - головний файл для ініціалізації додатку Graph Editor
 */

document.addEventListener("DOMContentLoaded", () => {
  // Ініціалізація GraphManager
  const graphManager = new GraphManager('cy', {
    isDirected: true,
    nodeRadius: 30
  });

  // Ініціалізація GridManager
  const gridManager = new GridManager(graphManager.cy, 'gridCanvas', {
    gridSize: 50,
    snapEnabled: true
  });

  // Ініціалізація HistoryManager
  const historyManager = new HistoryManager(graphManager);

  // Ініціалізація GraphAlgorithms
  const algorithms = new GraphAlgorithms(graphManager.cy, true);

  // Ініціалізація ImportExportManager
  const importExportManager = new ImportExportManager(graphManager);

  // Ініціалізація UIManager
  const uiManager = new UIManager(
    graphManager,
    gridManager,
    historyManager,
    algorithms,
    importExportManager
  );

  // Збереження початкового стану
  historyManager.saveState();

  // Експорт для глобального доступу (для debugging)
  window.GraphEditorApp = {
    graphManager,
    gridManager,
    historyManager,
    algorithms,
    importExportManager,
    uiManager
  };

  console.log("Graph Editor initialized successfully!");
});
