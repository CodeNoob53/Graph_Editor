export const cytoscapeStyles = [
  {
    selector: 'node',
    style: {
      'background-color': '#000000',
      'label': 'data(id)',
      'width': '1.5em',
      'height': '1.5em',
      'color': 'white',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '1.5em',
      'border-width': 3,
      'border-color': '#E9E9E9',
      'border-style': 'solid',
      'padding': '10px',
      'events': 'yes',
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 3,
      'line-color': '#FFFFFF',
      'target-arrow-color': '#00AEFF',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': '',
    },
  },
  {
    selector: 'edge[weight]',
    style: {
      'target-arrow-color': '#FFAF36',
      'label': 'data(weight)',
      'font-size': '1.2em',
      'font-weight': 'bold',
      'color': 'deepskyblue',
      'text-background-color': '#1A1A1A',
      'text-background-padding': '4px',
      'text-border-color': '#FFFFFF',
      'text-border-opacity': 0.7,
      'text-border-width': '1px',
      'text-background-opacity': 0.9,
    },
  },
  {
    selector: '.highlighted',
    style: {
      'background-color': '#ff5d00',
      'line-color': '#ff5d00',
      'target-arrow-color': '#ff5d00',
      'width': 5,
      'border-color': '#ffaf36',
      'border-width': '5px',
      'z-index': 999
    },
  },
  {
    selector: '.eh-handle',
    style: {
      'background-color': 'red',
      'width': 12,
      'height': 12,
      'shape': 'ellipse',
      'overlay-opacity': 0,
      'border-width': 12,
      'border-opacity': 0,
    },
  },
  {
    selector: '.eh-hover',
    style: {
      'background-color': 'red',
    },
  },
  {
    selector: '.eh-source',
    style: {
      'border-width': 2,
      'border-color': 'red',
    },
  },
  {
    selector: '.eh-target',
    style: {
      'border-width': 2,
      'border-color': 'red',
    },
  },
  {
    selector: '.eh-preview, .eh-ghost-edge',
    style: {
      'background-color': 'red',
      'line-color': 'tomato',
      'target-arrow-color': 'red',
      'source-arrow-color': 'red',
      'opacity': 1,
    },
  },
  {
    selector: '.eh-ghost-edge.eh-preview-active',
    style: {
      'opacity': 0
    }
  },
  {
    selector: '.active-node',
    style: {
      'background-color': 'black',
      'border-color': '#1BA4FF',
      'border-width': '4px',
      'background-opacity': 0.8
    }
  },
  {
    selector: '.active-edge',
    style: {
      'line-color': '#FFBC65',
      'width': '4px',
      'source-arrow-color': '#FFD700',
      'opacity': 1
    }
  },
  {
    selector: 'node.selected',
    style: {
      'background-color': '#FFD700',
      'border-color': '#FFD700',
      'border-width': '4px',
      'background-opacity': 0.8
    }
  },
  {
    selector: 'edge.selected',
    style: {
      'line-color': '#FFF3AF',
      'width': '6px',
      'source-arrow-color': '#FDE594',
      'opacity': 1
    }
  }
];
