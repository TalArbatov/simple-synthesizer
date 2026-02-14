import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SynthLayout } from './components/SynthLayout';
import { StartPage } from './components/StartPage';
import { bootstrapSynth } from './application/synth/bootstrap.js';
import type { SynthRuntime } from './application/synth/runtime.js';

declare global {
  interface Window {
    __synthAppStarted?: boolean;
  }
}

function SynthPage() {
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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/start" element={<StartPage />} />
        <Route path="/synth" element={<SynthPage />} />
        <Route path="*" element={<Navigate to="/start" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
