import { GraphEditor } from './GraphEditor.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

document.addEventListener("DOMContentLoaded", () => {
  try {
    const graphEditor = new GraphEditor('cy');
    window.graphEditor = graphEditor;
  } catch (error) {
    console.error('Failed to initialize Graph Editor:', error);
  }
});
