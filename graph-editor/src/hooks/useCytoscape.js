import { useState, useEffect } from 'react';
import cytoscape from 'cytoscape';

export default function useCytoscape(containerRef, options = {}) {
  const [cy, setCy] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cyInstance = cytoscape({
      container: containerRef.current,
      style: [
        // ваші стилі
      ],
      minZoom: 0.1,
      maxZoom: 4.0,
      wheelSensitivity: 0.05,
      zoom: 1.0,
      ...options
    });

    setCy(cyInstance);

    return () => {
      cyInstance.destroy();
    };
  }, [containerRef, options]); // вилучено options з залежностей

  return cy;
}
