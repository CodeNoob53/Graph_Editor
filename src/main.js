import { GraphEditor } from './GraphEditor.js';

document.addEventListener("DOMContentLoaded", () => {
  try {
    const graphEditor = new GraphEditor('cy');
    window.graphEditor = graphEditor;
  } catch (error) {
    console.error('Failed to initialize Graph Editor:', error);
  }
});
