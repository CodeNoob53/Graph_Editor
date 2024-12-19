import React from 'react';
import '../styles/Header.css'; // ваші стилі

function Header({
  onImport,
  onUndo,
  onRedo,
  onExport
}) {

  const handleImportChange = (e) => {
    const file = e.target.files[0];
    if (file && onImport) {
      onImport(file);
    }
  };

  return (
    <div id="header">
      <div className="graph_logo">
        <img src="assets/icons/graph_logo.svg" alt="Graph Logo" />
        <div id="appName">Graph Editor</div>
      </div>
      <div id="headerControls">
        <label>
          <img src="assets/icons/upload.svg" alt="Import" />
          Import
          <input type="file" accept=".json" style={{display:'none'}} onChange={handleImportChange} />
        </label>
        <button id="undo" onClick={onUndo}>
          <img src="assets/icons/undo.svg" alt="Undo" /> Undo
        </button>
        <button id="redo" onClick={onRedo}>
          <img src="assets/icons/redo.svg" alt="Redo" /> Redo
        </button>
        <button id="exportGraph" onClick={onExport}>
          <img src="assets/icons/download.svg" alt="Export" /> Export
        </button>
      </div>
    </div>
  );
}

export default Header;
