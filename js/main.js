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
    onNoteOff: () => engine.noteOff(),
  }
);

// --- Waveform display ---
const waveform = createWaveformDisplay(
  document.getElementById('waveform-canvas'),
  engine.analyser
);

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);
  waveform.draw();
  keyboard.draw();
}
animate();

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

  toggle.addEventListener('click', () => {
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
}

bindOscControls(0, 'osc1');
bindOscControls(1, 'osc2');
