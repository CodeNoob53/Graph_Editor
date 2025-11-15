import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import cxtmenu from 'cytoscape-cxtmenu';
import { cytoscapeStyles } from './cytoscapeStyles.js';

// Реєструємо розширення
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

export function initCytoscape(container) {
  const cy = cytoscape({
    container: container,
    minZoom: 0.1,
    maxZoom: 4.0,
    zoom: 1.0,
    style: cytoscapeStyles,
    layout: { name: 'grid', rows: 1 }
  });

  return cy;
}
