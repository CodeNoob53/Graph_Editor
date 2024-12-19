import React, { useState } from 'react';
import '../styles/Controls.css';

function Controls({
  onSetModeArrow,
  onSetModeNode,
  onSetModeEdge,
  onClearGraph,
  onGetInfo,
  onCalculateMST,
  onFindMinPath4,
  onListSpanningTrees,
  onFindPath // очікуємо функцію (sourceNode, targetNode)
}) {
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');

  const handleFindPath = () => {
    if (onFindPath) {
      onFindPath(sourceNode.trim(), targetNode.trim());
    }
  };

  return (
    <div id="controls">
      <button id="mouseArrow" onClick={onSetModeArrow}>Mouse Arrow</button>
      <button id="addNode" onClick={onSetModeNode}>Add Node</button>
      <button id="addEdge" onClick={onSetModeEdge}>Add Edge</button>
      <button id="clearGraph" onClick={onClearGraph}>Clear Graph</button>
      <button id="getInfo" onClick={onGetInfo}>Get Graph Info</button>
      <button id="calculateMST" onClick={onCalculateMST}>Calculate MST</button>
      <button id="findMinPath" onClick={onFindMinPath4}>Find Min Weighted Path (4 Vertices)</button>
      <button id="listSpanningTrees" onClick={onListSpanningTrees}>List All Spanning Trees</button>

      <div id="pathInputs">
        <input
          type="text"
          id="sourceNode"
          placeholder="Enter Source Node ID"
          value={sourceNode}
          onChange={(e) => setSourceNode(e.target.value)}
        />
        <input
          type="text"
          id="targetNode"
          placeholder="Enter Target Node ID"
          value={targetNode}
          onChange={(e) => setTargetNode(e.target.value)}
        />
        <button id="findPath" onClick={handleFindPath}>Find Path</button>
      </div>
    </div>
  );
}

export default Controls;
