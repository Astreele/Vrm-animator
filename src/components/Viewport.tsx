import { useEffect, useRef } from 'react';
import { Engine } from '../engine3d/Engine';

export default function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new Engine(containerRef.current, {});

    const initializeEngine = async () => {
      try {
        await engine.start();
        console.log('Engine started successfully.');

        await engine.loadModel('/models/model.vrm');
        console.log('VRM model loaded successfully.');
      } catch (error) {
        console.error('Failed to initialize engine or load model:', error);
      }
    };
    initializeEngine();
    return () => {
      engine.dispose();
    };
  }, []);

  return <div ref={containerRef} className="viewport" />;
}
