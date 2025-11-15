/**
 * graph-styles.js - стилі для Cytoscape графа
 * Винесено в окремий файл для кращої підтримки та можливості динамічної зміни
 */

export const graphStyles = [
  // Стилі вузлів
  {
    selector: 'node',
    style: {
      'background-color': '#5F8670',
      'label': 'data(id)',
      'width': 38,
      'height': 38,
      'color': 'white',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '26px',
      'border-width': 1,
      'border-color': '#005bb5',
      'border-style': 'solid',
      'padding': '5px',
      'events': 'yes',
    }
  },

  // Стилі ребер
  {
    selector: 'edge',
    style: {
      'width': 3,
      'line-color': '#6599ed',
      'target-arrow-color': '#3676ff',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(weight)',
      'font-size': '12px',
      'color': 'black',
      'text-background-color': '#ffffff',
      'text-background-opacity': 1,
      'text-background-shape': 'roundrectangle',
      'text-background-padding': '2px',
      'text-border-color': '#ccc',
      'text-border-width': '1px',
      'text-border-style': 'solid',
      'text-border-opacity': 1
    }
  },

  // Ребра з вагою
  {
    selector: 'edge[weight]',
    style: {
      'label': 'data(weight)',
      'font-size': '12px',
      'color': 'black',
      'text-background-color': '#ffffff',
      'text-background-opacity': 1,
      'text-background-shape': 'roundrectangle'
    }
  },

  // Підсвічені елементи
  {
    selector: ".highlighted",
    style: {
      "background-color": "#ff5d00",
      "line-color": "#ff5d00",
      "target-arrow-color": "#f7ba80"
    }
  },

  // Стилі для edgehandles плагіну
  {
    selector: '.eh-handle',
    style: {
      'background-color': 'red',
      'width': 12,
      'height': 12,
      'shape': 'ellipse',
      'overlay-opacity': 0,
      'border-width': 12,
      'border-opacity': 0
    }
  },
  {
    selector: '.eh-hover',
    style: {
      'background-color': 'red'
    }
  },
  {
    selector: '.eh-source',
    style: {
      'border-width': 2,
      'border-color': 'red'
    }
  },
  {
    selector: '.eh-target',
    style: {
      'border-width': 2,
      'border-color': 'red'
    }
  },
  {
    selector: '.eh-preview, .eh-ghost-edge',
    style: {
      'background-color': 'red',
      'line-color': 'red',
      'target-arrow-color': 'red',
      'source-arrow-color': 'red'
    }
  },
  {
    selector: '.eh-ghost-edge.eh-preview-active',
    style: {
      'opacity': 0
    }
  },

  // Активна вершина
  {
    selector: '.active-node',
    style: {
      'background-color': 'black',
      'border-color': '#FF8C00',
      'border-width': '2px',
      'background-opacity': 0.8
    }
  },

  // Активне ребро
  {
    selector: '.active-edge',
    style: {
      'line-color': '#FFD700',
      'width': '4px',
      'target-arrow-color': '#FFD700',
      'source-arrow-color': '#FFD700',
      'opacity': 1
    }
  }
];

/**
 * Тема для графа (можна легко змінювати)
 */
export const graphTheme = {
  node: {
    default: '#5F8670',
    highlighted: '#ff5d00',
    active: 'black',
    border: '#005bb5',
    activeBorder: '#FF8C00'
  },
  edge: {
    default: '#6599ed',
    arrow: '#3676ff',
    highlighted: '#ff5d00',
    active: '#FFD700'
  },
  text: {
    color: 'white',
    background: '#ffffff',
    border: '#ccc'
  }
};

/**
 * Функція для створення кастомних стилів на основі теми
 */
export function createCustomStyles(customTheme = {}) {
  const theme = { ...graphTheme, ...customTheme };

  return graphStyles.map(style => {
    // Можна динамічно змінювати кольори на основі теми
    if (style.selector === 'node') {
      return {
        ...style,
        style: {
          ...style.style,
          'background-color': theme.node.default,
          'border-color': theme.node.border
        }
      };
    }
    return style;
  });
}
