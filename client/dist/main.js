/**
 * Application entry point.
 * Creates shared resources (audio engine, LFOs, FX chain, sync) and
 * delegates all UI wiring to focused module functions.
 */
import { AudioEngine } from './modules/audio-engine.js';
import { createADSRGraph } from './modules/adsr-graph.js';
import { createPianoKeyboard } from './modules/piano-keyboard.js';
import { createWaveformDisplay } from './modules/waveform-display.js';
import { LFO } from './modules/lfo.js';
import { createSync } from './modules/sync.js';
import { createFXChain } from './modules/fx/fx-chain.js';
import { createEQGraph } from './modules/eq-graph.js';
import { upgradeAllSliders } from './modules/knob-registry.js';
import { buildLFOSection } from './modules/lfo-section.js';
import { initTabSwitching } from './modules/tab-switching.js';
import { bindOscControls } from './modules/bind-osc-controls.js';
import { bindAllLFOControls } from './modules/bind-lfo-controls.js';
import { bindAllFXControls } from './modules/bind-fx-controls.js';
import { initDragDrop } from './modules/drag-drop.js';
import { initSyncOutbound, initSyncReceive } from './modules/sync-handlers.js';
import { startAnimationLoop } from './modules/animation-loop.js';
// --- Core resources ---
const sync = createSync();
const engine = new AudioEngine(2);
const fxChain = createFXChain(engine.audioCtx);
engine.masterGain.disconnect();
engine.masterGain.connect(fxChain.input);
fxChain.output.connect(engine.analyser);
const lfos = [0, 1].map(() => Array.from({ length: 4 }, () => new LFO()));
let baseMasterVolume = 0.7;
engine.voices[0].setWaveform('sawtooth');
engine.voices[1].setWaveform('triangle');
// --- ADSR graphs ---
const adsrGraphs = [
    createADSRGraph(document.getElementById('adsr1-canvas'), document.getElementById('adsr1-values'), engine.voices[0].adsr, () => {
        const a = engine.voices[0].adsr;
        sync.send({ t: 'adsr', n: 0, a: a.a, d: a.d, s: a.s, r: a.r });
    }),
    createADSRGraph(document.getElementById('adsr2-canvas'), document.getElementById('adsr2-values'), engine.voices[1].adsr, () => {
        const a = engine.voices[1].adsr;
        sync.send({ t: 'adsr', n: 1, a: a.a, d: a.d, s: a.s, r: a.r });
    })
];
// --- Piano keyboard ---
const keyboard = createPianoKeyboard(document.getElementById('keyboard'), {
    onNoteOn: freq => {
        engine.noteOn(freq);
        sync.send({ t: 'noteOn', f: freq });
    },
    onNoteOff: freq => {
        engine.noteOff(freq);
        sync.send({ t: 'noteOff', f: freq });
    },
});
// --- Waveform display + EQ graph ---
const waveform = createWaveformDisplay(document.getElementById('waveform-canvas'), engine.analyser);
const eqGraph = createEQGraph(document.getElementById('fx-eq-canvas'), fxChain.eq);
// --- Build LFO sections before upgrading sliders ---
buildLFOSection(1);
buildLFOSection(2);
upgradeAllSliders();
// --- Drawable list (filter graphs added asynchronously) ---
const drawList = [waveform, keyboard, eqGraph];
startAnimationLoop(engine, lfos, drawList, () => baseMasterVolume);
// --- Lazy-load filter graphs ---
import('./modules/filter-graph.js').then(({ createFilterGraph }) => {
    drawList.push(createFilterGraph(document.getElementById('filter1-canvas'), document.getElementById('filter1-values'), engine.voices[0], () => { sync.send({ t: 'filter', n: 0, cutoff: engine.voices[0].cutoff, q: engine.voices[0].resonance }); }));
    drawList.push(createFilterGraph(document.getElementById('filter2-canvas'), document.getElementById('filter2-values'), engine.voices[1], () => { sync.send({ t: 'filter', n: 1, cutoff: engine.voices[1].cutoff, q: engine.voices[1].resonance }); }));
}).catch(e => console.error('Filter graph load failed:', e));
// --- Wire all UI controls ---
bindOscControls(0, 'osc1', engine);
bindOscControls(1, 'osc2', engine);
// Master volume
const masterVolumeInput = document.getElementById('master-volume');
const masterVolumeVal = document.getElementById('master-volume-val');
masterVolumeInput.addEventListener('input', () => {
    const vol = parseFloat(masterVolumeInput.value);
    masterVolumeVal.textContent = vol.toFixed(2);
    baseMasterVolume = vol;
    engine.setMasterVolume(vol);
});
bindAllLFOControls(lfos, engine);
bindAllFXControls(fxChain);
initDragDrop(lfos);
initTabSwitching();
// --- Sync ---
initSyncOutbound(sync);
initSyncReceive(sync, engine, adsrGraphs, keyboard);
//# sourceMappingURL=main.js.map