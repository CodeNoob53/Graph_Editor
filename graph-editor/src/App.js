import React from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import GraphEditor from './components/GraphEditor';
import InfoPanel from './components/InfoPanel';
import LoaderOverlay from './components/LoaderOverlay';

function App() {
  return (
    <div className="app-container">
      <Header />
      <Controls />
      <GraphEditor />
      <InfoPanel />
      <LoaderOverlay />
    </div>
  );
}

export default App;

