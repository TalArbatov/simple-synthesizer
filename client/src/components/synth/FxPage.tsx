import { useEffect, useState } from 'react';
import type { SynthRuntime } from '../../application/synth/runtime.js';
import type {
  ChorusParams,
  CompressorParams,
  DelayParams,
  EQParams,
  ReverbParams,
  SaturationParams,
} from '../../modules/types.js';

type ToggleState = {
  saturation: boolean;
  eq: boolean;
  chorus: boolean;
  delay: boolean;
  reverb: boolean;
  compressor: boolean;
  delayPP: boolean;
};

type FxValues = {
  satType: NonNullable<SaturationParams['type']>;
  satDrive: number;
  satOutput: number;
  satTone: number;
  satMix: number;

  eqHp: number;
  eqBandFreq: number;
  eqBandGain: number;
  eqBandQ: number;
  eqShelfFreq: number;
  eqShelfGain: number;

  chorusRate: number;
  chorusDepth: number;
  chorusDelay: number;
  chorusSpread: number;
  chorusMix: number;

  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  delayFilter: number;

  reverbSize: number;
  reverbPredelay: number;
  reverbDamping: number;
  reverbMix: number;

  compThreshold: number;
  compRatio: number;
  compAttack: number;
  compRelease: number;
  compMakeup: number;
};

const INITIAL_TOGGLES: ToggleState = {
  saturation: false,
  eq: false,
  chorus: false,
  delay: false,
  reverb: false,
  compressor: false,
  delayPP: false,
};

const INITIAL_VALUES: FxValues = {
  satType: 'soft',
  satDrive: 1,
  satOutput: 0.5,
  satTone: 4000,
  satMix: 1,

  eqHp: 20,
  eqBandFreq: 1000,
  eqBandGain: 0,
  eqBandQ: 1,
  eqShelfFreq: 8000,
  eqShelfGain: 0,

  chorusRate: 0.8,
  chorusDepth: 2,
  chorusDelay: 10,
  chorusSpread: 50,
  chorusMix: 0.5,

  delayTime: 300,
  delayFeedback: 0.3,
  delayMix: 0.3,
  delayFilter: 5000,

  reverbSize: 2,
  reverbPredelay: 10,
  reverbDamping: 8000,
  reverbMix: 0.3,

  compThreshold: -24,
  compRatio: 4,
  compAttack: 0.003,
  compRelease: 0.25,
  compMakeup: 0,
};

/**
 * React-managed FX controls. This replaces imperative DOM binders by mapping
 * every control to explicit state transitions + effect API calls.
 */
export function FxPage({ runtime, active }: { runtime: SynthRuntime | null; active: boolean }) {
  const [toggles, setToggles] = useState<ToggleState>(INITIAL_TOGGLES);
  const [values, setValues] = useState<FxValues>(INITIAL_VALUES);

  useEffect(() => {
    if (!runtime) return;
    runtime.fxChain.saturation.set({
      type: values.satType,
      drive: values.satDrive,
      output: values.satOutput,
      tone: values.satTone,
      mix: values.satMix,
    });
    runtime.fxChain.eq.set({
      hpFreq: values.eqHp,
      bandFreq: values.eqBandFreq,
      bandGain: values.eqBandGain,
      bandQ: values.eqBandQ,
      shelfFreq: values.eqShelfFreq,
      shelfGain: values.eqShelfGain,
    });
    runtime.fxChain.chorus.set({
      rate: values.chorusRate,
      depth: values.chorusDepth,
      delay: values.chorusDelay,
      spread: values.chorusSpread,
      mix: values.chorusMix,
    });
    runtime.fxChain.delay.set({
      time: values.delayTime,
      feedback: values.delayFeedback,
      mix: values.delayMix,
      filterFreq: values.delayFilter,
      pingPong: toggles.delayPP,
    });
    runtime.fxChain.reverb.set({
      size: values.reverbSize,
      preDelay: values.reverbPredelay,
      damping: values.reverbDamping,
      mix: values.reverbMix,
    });
    runtime.fxChain.compressor.set({
      threshold: values.compThreshold,
      ratio: values.compRatio,
      attack: values.compAttack,
      release: values.compRelease,
      makeup: values.compMakeup,
    });
  }, [runtime]); // apply defaults once runtime appears

  const setParam = <K extends keyof FxValues>(key: K, value: FxValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFx = (key: keyof ToggleState, apply: (enabled: boolean) => void) => {
    setToggles((prev) => {
      const enabled = !prev[key];
      apply(enabled);
      return { ...prev, [key]: enabled };
    });
  };

  const applySat = (params: SaturationParams) => runtime?.fxChain.saturation.set(params);
  const applyEq = (params: EQParams) => runtime?.fxChain.eq.set(params);
  const applyChorus = (params: ChorusParams) => runtime?.fxChain.chorus.set(params);
  const applyDelay = (params: DelayParams) => runtime?.fxChain.delay.set(params);
  const applyReverb = (params: ReverbParams) => runtime?.fxChain.reverb.set(params);
  const applyComp = (params: CompressorParams) => runtime?.fxChain.compressor.set(params);

  return (
    <div className={`main-page${active ? ' active' : ''}`} id="page-fx">
      <div className="synth-body">
        <div className={`fx-unit${toggles.saturation ? ' active' : ''}`} id="fx-saturation">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Saturation</span>
            <button
              className={`fx-toggle ${toggles.saturation ? 'on' : 'off'}`}
              id="fx-saturation-toggle"
              onClick={() => toggleFx('saturation', (on) => runtime?.fxChain.saturation.setEnabled(on))}
            >
              {toggles.saturation ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Type</label>
                <select
                  id="fx-sat-type"
                  value={values.satType}
                  onChange={(e) => {
                    const type = e.target.value as NonNullable<SaturationParams['type']>;
                    setParam('satType', type);
                    applySat({ type });
                  }}
                >
                  <option value="soft">Soft</option>
                  <option value="hard">Hard</option>
                  <option value="wave">Wave</option>
                </select>
              </div>
              <div className="control-group">
                <label>Drive</label>
                <input
                  type="range"
                  id="fx-sat-drive"
                  min="1"
                  max="100"
                  step="1"
                  value={values.satDrive}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('satDrive', v);
                    applySat({ drive: v });
                  }}
                />
                <div className="value-display" id="fx-sat-drive-val">{values.satDrive}</div>
              </div>
              <div className="control-group">
                <label>Output</label>
                <input
                  type="range"
                  id="fx-sat-output"
                  min="0"
                  max="1"
                  step="0.01"
                  value={values.satOutput}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('satOutput', v);
                    applySat({ output: v });
                  }}
                />
                <div className="value-display" id="fx-sat-output-val">{values.satOutput.toFixed(2)}</div>
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Tone</label>
                <input
                  type="range"
                  id="fx-sat-tone"
                  min="200"
                  max="8000"
                  step="10"
                  value={values.satTone}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('satTone', v);
                    applySat({ tone: v });
                  }}
                />
                <div className="value-display" id="fx-sat-tone-val">{values.satTone} Hz</div>
              </div>
              <div className="control-group">
                <label>Mix</label>
                <input
                  type="range"
                  id="fx-sat-mix"
                  min="0"
                  max="1"
                  step="0.01"
                  value={values.satMix}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('satMix', v);
                    applySat({ mix: v });
                  }}
                />
                <div className="value-display" id="fx-sat-mix-val">{values.satMix.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.eq ? ' active' : ''}`} id="fx-eq">
          <div className="fx-unit-header">
            <span className="fx-unit-label">EQ</span>
            <button
              className={`fx-toggle ${toggles.eq ? 'on' : 'off'}`}
              id="fx-eq-toggle"
              onClick={() => toggleFx('eq', (on) => runtime?.fxChain.eq.setEnabled(on))}
            >
              {toggles.eq ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>HP Freq</label>
                <input
                  type="range"
                  id="fx-eq-hp"
                  min="20"
                  max="2000"
                  step="1"
                  value={values.eqHp}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('eqHp', v);
                    applyEq({ hpFreq: v });
                  }}
                />
                <div className="value-display" id="fx-eq-hp-val">{values.eqHp} Hz</div>
              </div>
              <div className="control-group">
                <label>Band Freq</label>
                <input
                  type="range"
                  id="fx-eq-band-freq"
                  min="100"
                  max="10000"
                  step="10"
                  value={values.eqBandFreq}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('eqBandFreq', v);
                    applyEq({ bandFreq: v });
                  }}
                />
                <div className="value-display" id="fx-eq-band-freq-val">{values.eqBandFreq} Hz</div>
              </div>
              <div className="control-group">
                <label>Band Gain</label>
                <input
                  type="range"
                  id="fx-eq-band-gain"
                  min="-24"
                  max="24"
                  step="0.5"
                  value={values.eqBandGain}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('eqBandGain', v);
                    applyEq({ bandGain: v });
                  }}
                />
                <div className="value-display" id="fx-eq-band-gain-val">{values.eqBandGain} dB</div>
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Band Q</label>
                <input
                  type="range"
                  id="fx-eq-band-q"
                  min="0.1"
                  max="18"
                  step="0.1"
                  value={values.eqBandQ}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('eqBandQ', v);
                    applyEq({ bandQ: v });
                  }}
                />
                <div className="value-display" id="fx-eq-band-q-val">{values.eqBandQ.toFixed(1)}</div>
              </div>
              <div className="control-group">
                <label>Shelf Freq</label>
                <input
                  type="range"
                  id="fx-eq-shelf-freq"
                  min="1000"
                  max="16000"
                  step="100"
                  value={values.eqShelfFreq}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('eqShelfFreq', v);
                    applyEq({ shelfFreq: v });
                  }}
                />
                <div className="value-display" id="fx-eq-shelf-freq-val">{values.eqShelfFreq} Hz</div>
              </div>
              <div className="control-group">
                <label>Shelf Gain</label>
                <input
                  type="range"
                  id="fx-eq-shelf-gain"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={values.eqShelfGain}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setParam('eqShelfGain', v);
                    applyEq({ shelfGain: v });
                  }}
                />
                <div className="value-display" id="fx-eq-shelf-gain-val">{values.eqShelfGain} dB</div>
              </div>
            </div>
            <canvas className="fx-eq-canvas" id="fx-eq-canvas" width="560" height="120"></canvas>
          </div>
        </div>

        <div className={`fx-unit${toggles.chorus ? ' active' : ''}`} id="fx-chorus">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Chorus</span>
            <button
              className={`fx-toggle ${toggles.chorus ? 'on' : 'off'}`}
              id="fx-chorus-toggle"
              onClick={() => toggleFx('chorus', (on) => runtime?.fxChain.chorus.setEnabled(on))}
            >
              {toggles.chorus ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Rate (Hz)</label>
                <input type="range" id="fx-chorus-rate" min="0.1" max="5" step="0.1" value={values.chorusRate} onChange={(e) => { const v = parseFloat(e.target.value); setParam('chorusRate', v); applyChorus({ rate: v }); }} />
                <div className="value-display" id="fx-chorus-rate-val">{values.chorusRate.toFixed(1)}</div>
              </div>
              <div className="control-group">
                <label>Depth (ms)</label>
                <input type="range" id="fx-chorus-depth" min="0" max="20" step="0.5" value={values.chorusDepth} onChange={(e) => { const v = parseFloat(e.target.value); setParam('chorusDepth', v); applyChorus({ depth: v }); }} />
                <div className="value-display" id="fx-chorus-depth-val">{values.chorusDepth.toFixed(1)}</div>
              </div>
              <div className="control-group">
                <label>Delay (ms)</label>
                <input type="range" id="fx-chorus-delay" min="1" max="30" step="0.5" value={values.chorusDelay} onChange={(e) => { const v = parseFloat(e.target.value); setParam('chorusDelay', v); applyChorus({ delay: v }); }} />
                <div className="value-display" id="fx-chorus-delay-val">{values.chorusDelay.toFixed(1)}</div>
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Spread</label>
                <input type="range" id="fx-chorus-spread" min="0" max="100" step="1" value={values.chorusSpread} onChange={(e) => { const v = parseFloat(e.target.value); setParam('chorusSpread', v); applyChorus({ spread: v }); }} />
                <div className="value-display" id="fx-chorus-spread-val">{values.chorusSpread}%</div>
              </div>
              <div className="control-group">
                <label>Mix</label>
                <input type="range" id="fx-chorus-mix" min="0" max="1" step="0.01" value={values.chorusMix} onChange={(e) => { const v = parseFloat(e.target.value); setParam('chorusMix', v); applyChorus({ mix: v }); }} />
                <div className="value-display" id="fx-chorus-mix-val">{values.chorusMix.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.delay ? ' active' : ''}`} id="fx-delay">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Delay</span>
            <button
              className={`fx-toggle ${toggles.delay ? 'on' : 'off'}`}
              id="fx-delay-toggle"
              onClick={() => toggleFx('delay', (on) => runtime?.fxChain.delay.setEnabled(on))}
            >
              {toggles.delay ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Time (ms)</label>
                <input type="range" id="fx-delay-time" min="1" max="2000" step="1" value={values.delayTime} onChange={(e) => { const v = parseFloat(e.target.value); setParam('delayTime', v); applyDelay({ time: v }); }} />
                <div className="value-display" id="fx-delay-time-val">{values.delayTime}</div>
              </div>
              <div className="control-group">
                <label>Feedback</label>
                <input type="range" id="fx-delay-feedback" min="0" max="0.95" step="0.01" value={values.delayFeedback} onChange={(e) => { const v = parseFloat(e.target.value); setParam('delayFeedback', v); applyDelay({ feedback: v }); }} />
                <div className="value-display" id="fx-delay-feedback-val">{values.delayFeedback.toFixed(2)}</div>
              </div>
              <div className="control-group">
                <label>Mix</label>
                <input type="range" id="fx-delay-mix" min="0" max="1" step="0.01" value={values.delayMix} onChange={(e) => { const v = parseFloat(e.target.value); setParam('delayMix', v); applyDelay({ mix: v }); }} />
                <div className="value-display" id="fx-delay-mix-val">{values.delayMix.toFixed(2)}</div>
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Ping-Pong</label>
                <button
                  className={`fx-toggle ${toggles.delayPP ? 'on' : 'off'}`}
                  id="fx-delay-pp"
                  onClick={() =>
                    toggleFx('delayPP', (on) => {
                      applyDelay({ pingPong: on });
                    })
                  }
                >
                  {toggles.delayPP ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="control-group">
                <label>Filter</label>
                <input type="range" id="fx-delay-filter" min="200" max="12000" step="100" value={values.delayFilter} onChange={(e) => { const v = parseFloat(e.target.value); setParam('delayFilter', v); applyDelay({ filterFreq: v }); }} />
                <div className="value-display" id="fx-delay-filter-val">{values.delayFilter} Hz</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.reverb ? ' active' : ''}`} id="fx-reverb">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Reverb</span>
            <button
              className={`fx-toggle ${toggles.reverb ? 'on' : 'off'}`}
              id="fx-reverb-toggle"
              onClick={() => toggleFx('reverb', (on) => runtime?.fxChain.reverb.setEnabled(on))}
            >
              {toggles.reverb ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Size (s)</label>
                <input type="range" id="fx-reverb-size" min="0.1" max="8" step="0.1" value={values.reverbSize} onChange={(e) => { const v = parseFloat(e.target.value); setParam('reverbSize', v); applyReverb({ size: v }); }} />
                <div className="value-display" id="fx-reverb-size-val">{values.reverbSize.toFixed(1)}</div>
              </div>
              <div className="control-group">
                <label>Pre-delay (ms)</label>
                <input type="range" id="fx-reverb-predelay" min="0" max="100" step="1" value={values.reverbPredelay} onChange={(e) => { const v = parseFloat(e.target.value); setParam('reverbPredelay', v); applyReverb({ preDelay: v }); }} />
                <div className="value-display" id="fx-reverb-predelay-val">{values.reverbPredelay}</div>
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Damping</label>
                <input type="range" id="fx-reverb-damping" min="1000" max="16000" step="100" value={values.reverbDamping} onChange={(e) => { const v = parseFloat(e.target.value); setParam('reverbDamping', v); applyReverb({ damping: v }); }} />
                <div className="value-display" id="fx-reverb-damping-val">{values.reverbDamping} Hz</div>
              </div>
              <div className="control-group">
                <label>Mix</label>
                <input type="range" id="fx-reverb-mix" min="0" max="1" step="0.01" value={values.reverbMix} onChange={(e) => { const v = parseFloat(e.target.value); setParam('reverbMix', v); applyReverb({ mix: v }); }} />
                <div className="value-display" id="fx-reverb-mix-val">{values.reverbMix.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.compressor ? ' active' : ''}`} id="fx-compressor">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Compressor</span>
            <button
              className={`fx-toggle ${toggles.compressor ? 'on' : 'off'}`}
              id="fx-compressor-toggle"
              onClick={() => toggleFx('compressor', (on) => runtime?.fxChain.compressor.setEnabled(on))}
            >
              {toggles.compressor ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Threshold</label>
                <input type="range" id="fx-comp-threshold" min="-60" max="0" step="1" value={values.compThreshold} onChange={(e) => { const v = parseFloat(e.target.value); setParam('compThreshold', v); applyComp({ threshold: v }); }} />
                <div className="value-display" id="fx-comp-threshold-val">{values.compThreshold} dB</div>
              </div>
              <div className="control-group">
                <label>Ratio</label>
                <input type="range" id="fx-comp-ratio" min="1" max="20" step="0.5" value={values.compRatio} onChange={(e) => { const v = parseFloat(e.target.value); setParam('compRatio', v); applyComp({ ratio: v }); }} />
                <div className="value-display" id="fx-comp-ratio-val">{values.compRatio.toFixed(1)}</div>
              </div>
              <div className="control-group">
                <label>Attack</label>
                <input type="range" id="fx-comp-attack" min="0.001" max="0.1" step="0.001" value={values.compAttack} onChange={(e) => { const v = parseFloat(e.target.value); setParam('compAttack', v); applyComp({ attack: v }); }} />
                <div className="value-display" id="fx-comp-attack-val">{Math.round(values.compAttack * 1000)} ms</div>
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Release</label>
                <input type="range" id="fx-comp-release" min="0.01" max="1" step="0.01" value={values.compRelease} onChange={(e) => { const v = parseFloat(e.target.value); setParam('compRelease', v); applyComp({ release: v }); }} />
                <div className="value-display" id="fx-comp-release-val">{Math.round(values.compRelease * 1000)} ms</div>
              </div>
              <div className="control-group">
                <label>Makeup (dB)</label>
                <input type="range" id="fx-comp-makeup" min="0" max="24" step="0.5" value={values.compMakeup} onChange={(e) => { const v = parseFloat(e.target.value); setParam('compMakeup', v); applyComp({ makeup: v }); }} />
                <div className="value-display" id="fx-comp-makeup-val">{values.compMakeup.toFixed(1)} dB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

