import React, { useRef, useEffect } from 'react';
import useCytoscape from '../hooks/useCytoscape';
import useGrid from '../hooks/useGrid';
import '../styles/GraphEditor.css';

function GraphEditor() {
  const cyRef = useRef(null);
  
  // Ініціалізуємо cytoscape екземпляр за допомогою кастомного хука
  const cy = useCytoscape(cyRef, {
    containerOptions: { width: 800, height: 600 },
    // будь-які додаткові параметри ініціалізації cytoscape можна передати сюди
  });

  // Хук для малювання сітки, приймає cy, canvas та інші параметри
  const gridCanvasRef = useRef(null);
  useGrid(cy, gridCanvasRef, {
    gridSize: 50,
    snapEnabled: true
  });

  // Оновлення масштабу в DOM (наприклад, у div#zoomDisplay)
  useEffect(() => {
    if (!cy) return;
    const zoomDisplay = document.getElementById("zoomDisplay");
    const updateZoomDisplay = () => {
      if (zoomDisplay) {
        zoomDisplay.innerText = `Zoom: ${(cy.zoom() * 100).toFixed(0)}%`;
      }
    };

    cy.on('zoom', updateZoomDisplay);
    updateZoomDisplay(); // Одноразовий виклик при монтуванні
    return () => {
      cy.off('zoom', updateZoomDisplay);
    };
  }, [cy]);

  return (
    <div id="editor" style={{ position: 'relative' }}>
      <div 
        id="cy"
        ref={cyRef}
        style={{ width: '800px', height: '600px', border: '1px solid #3c3c3c' }}
      ></div>
      <canvas
        id="gridCanvas"
        ref={gridCanvasRef}
        width="800"
        height="600"
        style={{ position: 'absolute', top:0, left:0, pointerEvents:'none' }}
      ></canvas>
      <div id="zoomDisplay"></div>
    </div>
  );
}

export default GraphEditor;
