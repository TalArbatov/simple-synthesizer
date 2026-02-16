import { useOsc } from '../../context/PatchContext';
import { ModKnobControl } from './ModKnobControl';
import type { ModDestination } from '../../models/patch.js';

export function FilterPanel({ oscIndex }: { oscIndex: 0 | 1 }) {
  const n = (oscIndex + 1) as 1 | 2;
  const { osc, setOsc } = useOsc(oscIndex);
  const cutoffDest: ModDestination = `filter${n}-cutoff`;

  return (
    <div
      className={`filter-panel${osc.filterEnabled ? '' : ' disabled'}`}
      id={`filter${n}-section`}
    >
      <div className="filter-panel-header">
        <span className="filter-panel-label">FILTER {n}</span>
        <div className="filter-header">
          <select
            id={`filter-type${n}`}
            value={osc.filterType}
            onChange={(e) => setOsc({ filterType: e.target.value as BiquadFilterType })}
          >
            <option value="lowpass">Low Pass</option>
            <option value="highpass">High Pass</option>
            <option value="bandpass">Band Pass</option>
          </select>
          <button
            className={`filter-toggle ${osc.filterEnabled ? 'on' : 'off'}`}
            id={`filter-toggle${n}`}
            onClick={() => setOsc({ filterEnabled: !osc.filterEnabled })}
          >
            {osc.filterEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <canvas className="filter-canvas" id={`filter${n}-canvas`} width="380" height="100"></canvas>
      <div className="filter-values" id={`filter${n}-values`}></div>
    </div>
  );
}
