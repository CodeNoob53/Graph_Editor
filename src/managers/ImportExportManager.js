/**
 * ImportExportManager - клас для імпорту та експорту графів
 */
export class ImportExportManager {
  constructor(graphManager) {
    this.graphManager = graphManager;
  }

  /**
   * Експорт графа в JSON файл
   */
  exportToFile() {
    const graphData = this.graphManager.exportToJSON();
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'graph.json';
    link.click();
  }

  /**
   * Імпорт графа з JSON файлу
   */
  importFromFile(file, callback) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const graphData = JSON.parse(e.target.result);
        this.graphManager.importFromJSON(graphData);

        if (callback) {
          callback(true, "Graph imported successfully.");
        }
      } catch (error) {
        console.error("Error importing graph:", error);
        if (callback) {
          callback(false, "Failed to import graph. Please check the file format.");
        }
      }
    };
    reader.readAsText(file);
  }

  /**
   * Експорт графа в JSON строку
   */
  exportToString() {
    const graphData = this.graphManager.exportToJSON();
    return JSON.stringify(graphData, null, 2);
  }

  /**
   * Імпорт графа з JSON строки
   */
  importFromString(jsonString) {
    try {
      const graphData = JSON.parse(jsonString);
      this.graphManager.importFromJSON(graphData);
      return { success: true, message: "Graph imported successfully." };
    } catch (error) {
      console.error("Error importing graph:", error);
      return { success: false, message: "Failed to import graph. Invalid JSON." };
    }
  }
}
