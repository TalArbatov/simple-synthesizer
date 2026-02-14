import { useEffect, useRef, useState } from 'react';
import { SynthLayout } from './components/SynthLayout';
import { bootstrapSynth } from './application/synth/bootstrap.js';
import type { SynthRuntime } from './application/synth/runtime.js';

declare global {
  interface Window {
    __synthAppStarted?: boolean;
  }
}

export function App() {
  const runtimeRef = useRef<SynthRuntime | null>(null);
  const [runtime, setRuntime] = useState<SynthRuntime | null>(null);

  useEffect(() => {
    if (!window.__synthAppStarted) {
      window.__synthAppStarted = true;
      runtimeRef.current = bootstrapSynth();
      setRuntime(runtimeRef.current);
    }
  }, []);

  return <SynthLayout runtime={runtime} />;
}
