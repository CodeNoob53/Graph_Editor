import React from 'react';
import '../styles/InfoPanel.css';

function InfoPanel({ info }) {
  return (
    <div id="info" dangerouslySetInnerHTML={{ __html: info }} />
  );
}

export default InfoPanel;
