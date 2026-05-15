import { useEditorStore } from '../store/useEditorStore';

export default function TimelineControls() {
  // Connect to your Zustand store
  const playing = useEditorStore((state) => state.playing);
  const setPlaying = useEditorStore((state) => state.setPlaying);

  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10 }}>
      <button
        onClick={() => setPlaying(!playing)}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
    </div>
  );
}
