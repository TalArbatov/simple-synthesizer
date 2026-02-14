import { AudioEngine } from './modules/audio-engine.js';
import { createADSRGraph } from './modules/adsr-graph.js';
import { createPianoKeyboard } from './modules/piano-keyboard.js';
import { createWaveformDisplay } from './modules/waveform-display.js';

// --- Audio engine (2 oscillator voices) ---
const engine = new AudioEngine(2);

// --- Default waveforms to match HTML select defaults ---
engine.voices[0].setWaveform('sawtooth');
engine.voices[1].setWaveform('triangle');

// --- ADSR graphs ---
createADSRGraph(
  document.getElementById('adsr1-canvas'),
  document.getElementById('adsr1-values'),
  engine.voices[0].adsr
);
createADSRGraph(
  document.getElementById('adsr2-canvas'),
  document.getElementById('adsr2-values'),
  engine.voices[1].adsr
);

// --- Piano keyboard ---
const keyboard = createPianoKeyboard(
  document.getElementById('keyboard'),
  {
    onNoteOn: freq => engine.noteOn(freq),
    onNoteOff: freq => engine.noteOff(freq),
  }
);

// --- Waveform display ---
const waveform = createWaveformDisplay(
  document.getElementById('waveform-canvas'),
  engine.analyser
);

// --- Animation loop (started before filter graphs so keyboard always works) ---
const drawList = [waveform, keyboard];

function animate() {
  requestAnimationFrame(animate);
  for (const item of drawList) {
    item.draw();
  }
}
animate();

// --- Filter graphs (dynamic import so it can't block the rest of the page) ---
import('./modules/filter-graph.js').then(({ createFilterGraph }) => {
  const fg1 = createFilterGraph(
    document.getElementById('filter1-canvas'),
    document.getElementById('filter1-values'),
    engine.voices[0]
  );
  drawList.push(fg1);

  const fg2 = createFilterGraph(
    document.getElementById('filter2-canvas'),
    document.getElementById('filter2-values'),
    engine.voices[1]
  );
  drawList.push(fg2);
}).catch(e => console.error('Filter graph load failed:', e));

// --- Master volume ---
const masterVolumeSlider = document.getElementById('master-volume');
const masterVolumeVal = document.getElementById('master-volume-val');
masterVolumeSlider.addEventListener('input', () => {
  const vol = parseFloat(masterVolumeSlider.value);
  masterVolumeVal.textContent = vol.toFixed(2);
  engine.setMasterVolume(vol);
});

// --- Per-oscillator controls ---
function bindOscControls(voiceIndex, prefix) {
  const voice = engine.voices[voiceIndex];
  const section = document.getElementById(`${prefix}-section`);
  const toggle = document.getElementById(`toggle${voiceIndex + 1}`);
  const waveformSel = document.getElementById(`waveform${voiceIndex + 1}`);
  const volumeSlider = document.getElementById(`volume${voiceIndex + 1}`);
  const volumeVal = document.getElementById(`volume${voiceIndex + 1}-val`);
  const detuneSlider = document.getElementById(`detune${voiceIndex + 1}`);
  const detuneVal = document.getElementById(`detune${voiceIndex + 1}-val`);

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const enabled = !voice.enabled;
    voice.setEnabled(enabled);
    toggle.textContent = enabled ? 'ON' : 'OFF';
    toggle.classList.toggle('on', enabled);
    toggle.classList.toggle('off', !enabled);
    section.classList.toggle('disabled', !enabled);
  });

  waveformSel.addEventListener('change', () => {
    voice.setWaveform(waveformSel.value);
  });

  volumeSlider.addEventListener('input', () => {
    const vol = parseFloat(volumeSlider.value);
    volumeVal.textContent = vol.toFixed(2);
    voice.setVolume(vol);
  });

  detuneSlider.addEventListener('input', () => {
    const cents = parseFloat(detuneSlider.value);
    detuneVal.textContent = detuneSlider.value;
    voice.setDetune(cents);
  });

  const unisonCountSlider = document.getElementById(`unison-count${voiceIndex + 1}`);
  const unisonCountVal = document.getElementById(`unison-count${voiceIndex + 1}-val`);
  const unisonDetuneSlider = document.getElementById(`unison-detune${voiceIndex + 1}`);
  const unisonDetuneVal = document.getElementById(`unison-detune${voiceIndex + 1}-val`);
  const unisonSpreadSlider = document.getElementById(`unison-spread${voiceIndex + 1}`);
  const unisonSpreadVal = document.getElementById(`unison-spread${voiceIndex + 1}-val`);

  unisonCountSlider.addEventListener('input', () => {
    const n = parseInt(unisonCountSlider.value);
    unisonCountVal.textContent = n;
    voice.setUnisonCount(n);
  });

  unisonDetuneSlider.addEventListener('input', () => {
    const cents = parseFloat(unisonDetuneSlider.value);
    unisonDetuneVal.textContent = cents;
    voice.setUnisonDetune(cents);
  });

  unisonSpreadSlider.addEventListener('input', () => {
    const spread = parseFloat(unisonSpreadSlider.value) / 100;
    unisonSpreadVal.textContent = unisonSpreadSlider.value + '%';
    voice.setUnisonSpread(spread);
  });

  const filterTypeSel = document.getElementById(`filter-type${voiceIndex + 1}`);
  filterTypeSel.addEventListener('change', () => {
    voice.setFilterType(filterTypeSel.value);
  });

  const filterToggle = document.getElementById(`filter-toggle${voiceIndex + 1}`);
  const filterSection = document.getElementById(`filter${voiceIndex + 1}-section`);
  filterToggle.addEventListener('click', () => {
    const enabled = !voice.filterEnabled;
    voice.setFilterEnabled(enabled);
    filterToggle.textContent = enabled ? 'ON' : 'OFF';
    filterToggle.classList.toggle('on', enabled);
    filterToggle.classList.toggle('off', !enabled);
    filterSection.classList.toggle('disabled', !enabled);
  });
}

bindOscControls(0, 'osc1');
bindOscControls(1, 'osc2');

// --- Tab switching ---
const oscTabs = document.querySelectorAll('.osc-tab');
const oscSections = document.querySelectorAll('.osc-section');

oscTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const oscNum = tab.dataset.osc;
    oscTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    oscSections.forEach(s => s.classList.add('hidden'));
    document.getElementById(`osc${oscNum}-section`).classList.remove('hidden');
  });
});
