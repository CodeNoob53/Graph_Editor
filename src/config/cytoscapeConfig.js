import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import cxtmenu from 'cytoscape-cxtmenu';
import dagre from 'cytoscape-dagre';
import { cytoscapeStyles } from './cytoscapeStyles.js';

// Реєструємо розширення
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);
cytoscape.use(dagre);

export function initCytoscape(container) {
  const cy = cytoscape({
    container: container,
    minZoom: 0.1,
    maxZoom: 4.0,
    zoom: 1.0,
    style: cytoscapeStyles,
    layout: { name: 'grid', rows: 1 },

    // Налаштування продуктивності для великих графів
    // Згідно з офіційною документацією: https://js.cytoscape.org/#core/initialisation
    hideEdgesOnViewport: true,  // Приховує ребра під час pan/zoom (для 1000+ ребер)
    textureOnViewport: true,    // Використовує текстурний кеш під час взаємодії
    motionBlur: false,          // Вимикаємо motion blur для кращої продуктивності
    pixelRatio: 'auto',         // Автоматично визначає pixel ratio
    wheelSensitivity: 0.2       // Чутливість скролу
  });

  return cy;
}
