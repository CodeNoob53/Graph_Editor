// src/utils/graphIO.js

// Експортувати граф у файл JSON
export function exportGraph(cy) {
    const graphData = cy.json();
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'graph.json';
    link.click();
  }
  
  // Імпортувати граф з JSON-файлу
  export function importGraph(cy, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const graphData = JSON.parse(e.target.result);
        cy.json(graphData);
      } catch (error) {
        console.error("Invalid JSON file:", error);
      }
    };
    reader.readAsText(file);
  }
  