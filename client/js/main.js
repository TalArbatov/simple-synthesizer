import { AudioEngine } from './modules/audio-engine.js';
import { createADSRGraph } from './modules/adsr-graph.js';
import { createPianoKeyboard } from './modules/piano-keyboard.js';
import { createWaveformDisplay } from './modules/waveform-display.js';
import { LFO } from './modules/lfo.js';
import { createSync } from './modules/sync.js';
import { createFXChain } from './modules/fx/fx-chain.js';
import { createWaveformPreview } from './modules/waveform-preview.js';
import { createKnob } from './modules/knob.js';

// --- Sync ---
const sync = createSync();

// --- Audio engine (2 oscillator voices) ---
const engine = new AudioEngine(2);

// --- FX Chain ---
const fxChain = createFXChain(engine.audioCtx);
engine.masterGain.disconnect();
engine.masterGain.connect(fxChain.input);
fxChain.output.connect(engine.analyser);

// --- LFOs (one per oscillator) ---
const lfos = [new LFO(), new LFO()];
let baseMasterVolume = 0.7;

// --- Default waveforms to match HTML select defaults ---
engine.voices[0].setWaveform('sawtooth');
engine.voices[1].setWaveform('triangle');

// --- ADSR graphs (with sync onChange) ---
const adsrGraphs = [
  createADSRGraph(
    document.getElementById('adsr1-canvas'),
    document.getElementById('adsr1-values'),
    engine.voices[0].adsr,
    () => {
      const a = engine.voices[0].adsr;
      sync.send({ t: 'adsr', n: 0, a: a.a, d: a.d, s: a.s, r: a.r });
    }
  ),
  createADSRGraph(
    document.getElementById('adsr2-canvas'),
    document.getElementById('adsr2-values'),
    engine.voices[1].adsr,
    () => {
      const a = engine.voices[1].adsr;
      sync.send({ t: 'adsr', n: 1, a: a.a, d: a.d, s: a.s, r: a.r });
    }
  )
];

// --- Piano keyboard ---
const keyboard = createPianoKeyboard(
  document.getElementById('keyboard'),
  {
    onNoteOn: freq => {
      engine.noteOn(freq);
      sync.send({ t: 'noteOn', f: freq });
    },
    onNoteOff: freq => {
      engine.noteOff(freq);
      sync.send({ t: 'noteOff', f: freq });
    },
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

  // LFO modulation
  const now = performance.now() / 1000;
  let masterVolMod = 0;
  for (let i = 0; i < 2; i++) {
    const lfo = lfos[i], voice = engine.voices[i];
    const val = lfo.getValue(now);
    if (lfo.hasTarget('filter')) {
      voice.applyModulatedCutoff(voice.cutoff * Math.pow(2, val * 3));
    } else {
      voice.applyModulatedCutoff(voice.cutoff);
    }
    if (lfo.hasTarget('volume')) masterVolMod += val;
  }
  const modVol = Math.max(0, Math.min(1, baseMasterVolume * (1 + masterVolMod)));
  engine.masterGain.gain.setValueAtTime(modVol, engine.audioCtx.currentTime);

  for (const item of drawList) {
    item.draw();
  }
}
animate();

// --- Filter graphs (with sync onChange) ---
import('./modules/filter-graph.js').then(({ createFilterGraph }) => {
  const fg1 = createFilterGraph(
    document.getElementById('filter1-canvas'),
    document.getElementById('filter1-values'),
    engine.voices[0],
    () => {
      sync.send({
        t: 'filter', n: 0,
        cutoff: engine.voices[0].cutoff, q: engine.voices[0].resonance
      });
    }
  );
  drawList.push(fg1);

  const fg2 = createFilterGraph(
    document.getElementById('filter2-canvas'),
    document.getElementById('filter2-values'),
    engine.voices[1],
    () => {
      sync.send({
        t: 'filter', n: 1,
        cutoff: engine.voices[1].cutoff, q: engine.voices[1].resonance
      });
    }
  );
  drawList.push(fg2);
}).catch(e => console.error('Filter graph load failed:', e));

// --- Master volume ---
const masterVolumeSlider = document.getElementById('master-volume');
const masterVolumeVal = document.getElementById('master-volume-val');
masterVolumeSlider.addEventListener('input', () => {
  const vol = parseFloat(masterVolumeSlider.value);
  masterVolumeVal.textContent = vol.toFixed(2);
  baseMasterVolume = vol;
  engine.setMasterVolume(vol);
});

// --- Per-oscillator controls ---
const detuneKnobs = [];

function bindOscControls(voiceIndex, prefix) {
  const voice = engine.voices[voiceIndex];
  const section = document.getElementById(`${prefix}-section`);
  const toggle = document.getElementById(`toggle${voiceIndex + 1}`);
  const waveformSel = document.getElementById(`waveform${voiceIndex + 1}`);
  const volumeSlider = document.getElementById(`volume${voiceIndex + 1}`);
  const volumeVal = document.getElementById(`volume${voiceIndex + 1}-val`);
  const detuneInput = document.getElementById(`detune${voiceIndex + 1}`);
  const detuneVal = document.getElementById(`detune${voiceIndex + 1}-val`);

  // Waveform preview
  const wfPreview = createWaveformPreview(
    document.getElementById(`waveform${voiceIndex + 1}-preview`)
  );
  wfPreview.setWaveform(waveformSel.value);

  // Detune knob
  const knob = createKnob(
    document.getElementById(`detune${voiceIndex + 1}-knob`),
    detuneInput,
    {
      min: -100, max: 100, step: 1, value: 0,
      onChange(v) {
        detuneVal.textContent = Math.round(v);
        voice.setDetune(v);
      }
    }
  );
  detuneKnobs[voiceIndex] = knob;

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
    wfPreview.setWaveform(waveformSel.value);
  });

  volumeSlider.addEventListener('input', () => {
    const vol = parseFloat(volumeSlider.value);
    volumeVal.textContent = vol.toFixed(2);
    voice.setVolume(vol);
  });

  detuneInput.addEventListener('input', () => {
    const cents = parseFloat(detuneInput.value);
    detuneVal.textContent = Math.round(cents);
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

// --- LFO controls ---
function bindLFOControls(lfoIndex) {
  const lfo = lfos[lfoIndex];
  const n = lfoIndex + 1;

  const waveformSel = document.getElementById(`lfo-waveform${n}`);
  const rateSlider = document.getElementById(`lfo-rate${n}`);
  const rateVal = document.getElementById(`lfo-rate${n}-val`);
  const depthSlider = document.getElementById(`lfo-depth${n}`);
  const depthVal = document.getElementById(`lfo-depth${n}-val`);
  const phaseSlider = document.getElementById(`lfo-phase${n}`);
  const phaseVal = document.getElementById(`lfo-phase${n}-val`);
  const delaySlider = document.getElementById(`lfo-delay${n}`);
  const delayVal = document.getElementById(`lfo-delay${n}-val`);
  const fadeinSlider = document.getElementById(`lfo-fadein${n}`);
  const fadeinVal = document.getElementById(`lfo-fadein${n}-val`);
  const syncToggle = document.getElementById(`lfo-sync${n}`);
  const bpmInput = document.getElementById(`lfo-bpm${n}`);
  const divisionSelect = document.getElementById(`lfo-division${n}`);
  const oneshotToggle = document.getElementById(`lfo-oneshot${n}`);

  // LFO waveform preview
  const lfoWfPreview = createWaveformPreview(
    document.getElementById(`lfo-waveform${n}-preview`)
  );
  lfoWfPreview.setWaveform(waveformSel.value);

  waveformSel.addEventListener('change', () => {
    lfo.waveform = waveformSel.value;
    lfoWfPreview.setWaveform(waveformSel.value);
  });

  rateSlider.addEventListener('input', () => {
    lfo.rate = parseFloat(rateSlider.value);
    rateVal.textContent = lfo.rate.toFixed(2);
  });

  depthSlider.addEventListener('input', () => {
    const pct = parseInt(depthSlider.value);
    lfo.depth = pct / 100;
    depthVal.textContent = pct + '%';
  });

  phaseSlider.addEventListener('input', () => {
    lfo.phase = parseInt(phaseSlider.value);
    phaseVal.textContent = lfo.phase + '\u00B0';
  });

  delaySlider.addEventListener('input', () => {
    lfo.delay = parseFloat(delaySlider.value);
    delayVal.textContent = lfo.delay.toFixed(2);
  });

  fadeinSlider.addEventListener('input', () => {
    lfo.fadeIn = parseFloat(fadeinSlider.value);
    fadeinVal.textContent = lfo.fadeIn.toFixed(2);
  });

  syncToggle.addEventListener('click', () => {
    lfo.bpmSync = !lfo.bpmSync;
    syncToggle.classList.toggle('on', lfo.bpmSync);
    syncToggle.classList.toggle('off', !lfo.bpmSync);
    bpmInput.disabled = !lfo.bpmSync;
    divisionSelect.disabled = !lfo.bpmSync;
    rateSlider.disabled = lfo.bpmSync;
  });

  bpmInput.addEventListener('input', () => {
    lfo.bpm = parseFloat(bpmInput.value) || 120;
  });

  divisionSelect.addEventListener('change', () => {
    lfo.syncDivision = divisionSelect.value;
  });

  oneshotToggle.addEventListener('click', () => {
    lfo.oneShot = !lfo.oneShot;
    oneshotToggle.classList.toggle('on', lfo.oneShot);
    oneshotToggle.classList.toggle('off', !lfo.oneShot);
  });

  // One-shot retrigger on note-on
  engine.voices[lfoIndex].onNoteOn = () => {
    if (lfo.oneShot) lfo.reset();
  };
}

bindLFOControls(0);
bindLFOControls(1);

// --- Drag-and-drop routing ---
function initDragDrop() {
  const dropTargets = document.querySelectorAll('[data-drop-target]');

  // Dragstart on MOD chips
  document.querySelectorAll('.lfo-mod-chip').forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', chip.dataset.lfo);
      e.dataTransfer.effectAllowed = 'link';
      // Highlight valid targets
      const lfoIdx = parseInt(chip.dataset.lfo);
      dropTargets.forEach(target => {
        const type = target.dataset.dropTarget;
        const oscNum = target.dataset.osc;
        // LFO can target its own osc's filter or master volume
        if (type === 'volume' || (type === 'filter' && parseInt(oscNum) === lfoIdx + 1)) {
          target.classList.add('drop-target-active');
        }
      });
    });

    chip.addEventListener('dragend', () => {
      dropTargets.forEach(target => {
        target.classList.remove('drop-target-active', 'drop-target-hover');
      });
    });
  });

  // Drop targets
  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      const lfoIdx = parseInt(e.dataTransfer.types.includes('text/plain') ? '0' : '-1');
      if (target.classList.contains('drop-target-active')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
        target.classList.add('drop-target-hover');
      }
    });

    target.addEventListener('dragleave', () => {
      target.classList.remove('drop-target-hover');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('drop-target-hover', 'drop-target-active');
      const lfoIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const lfo = lfos[lfoIdx];
      const type = target.dataset.dropTarget;
      const oscNum = target.dataset.osc;

      // Validate: LFO can only target its own osc's filter or master volume
      if (type === 'filter' && parseInt(oscNum) !== lfoIdx + 1) return;

      // Toggle target
      if (lfo.hasTarget(type)) {
        lfo.removeTarget(type);
      } else {
        lfo.addTarget(type);
        lfo.reset();
      }
      updateTargetBadges(lfoIdx);

      // Clean up all highlights
      dropTargets.forEach(t => t.classList.remove('drop-target-active'));
    });
  });
}

function updateTargetBadges(lfoIdx) {
  const container = document.getElementById(`lfo${lfoIdx + 1}-targets`);
  container.innerHTML = '';
  const lfo = lfos[lfoIdx];
  for (const target of lfo.targets) {
    const badge = document.createElement('span');
    badge.className = 'lfo-target-badge';
    const label = target === 'filter' ? `Filter ${lfoIdx + 1}` : 'Master Vol';
    badge.innerHTML = `${label} <span class="badge-remove">\u00D7</span>`;
    badge.querySelector('.badge-remove').addEventListener('click', () => {
      lfo.removeTarget(target);
      updateTargetBadges(lfoIdx);
    });
    container.appendChild(badge);
  }
}

initDragDrop();

// --- Main tab switching (OSC / FX) ---
const mainTabs = document.querySelectorAll('.main-tab');
const mainPages = document.querySelectorAll('.main-page');

mainTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const page = tab.dataset.page;
    mainTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    mainPages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
  });
});

// --- Osc sub-tab switching ---
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

// ══════════════════════════════════════════════
// WebSocket sync — broadcast all parameter changes
// ══════════════════════════════════════════════

// Sync standard inputs (ranges, number inputs) via event delegation
document.addEventListener('input', (e) => {
  if (e.target.id && e.target.tagName !== 'SELECT' && !sync.receiving) {
    sync.send({ t: 'ctrl', id: e.target.id, v: e.target.value });
  }
}, true);

// Sync selects via event delegation
document.addEventListener('change', (e) => {
  if (e.target.id && e.target.tagName === 'SELECT' && !sync.receiving) {
    sync.send({ t: 'ctrl', id: e.target.id, v: e.target.value });
  }
}, true);

// Sync toggle buttons
const syncedButtons = new Set([
  'toggle1', 'toggle2', 'filter-toggle1', 'filter-toggle2',
  'lfo-sync1', 'lfo-sync2', 'lfo-oneshot1', 'lfo-oneshot2',
  'fx-saturation-toggle', 'fx-eq-toggle', 'fx-chorus-toggle',
  'fx-delay-toggle', 'fx-delay-pp', 'fx-reverb-toggle', 'fx-compressor-toggle'
]);

document.addEventListener('click', (e) => {
  if (syncedButtons.has(e.target.id) && !sync.receiving) {
    sync.send({ t: 'click', id: e.target.id });
  }
}, true);

// --- FX controls ---
function bindFXToggle(id, effect, fxUnit) {
  const btn = document.getElementById(id);
  let enabled = false;
  btn.addEventListener('click', () => {
    enabled = !enabled;
    effect.setEnabled(enabled);
    btn.textContent = enabled ? 'ON' : 'OFF';
    btn.classList.toggle('on', enabled);
    btn.classList.toggle('off', !enabled);
    fxUnit.classList.toggle('active', enabled);
  });
}

bindFXToggle('fx-saturation-toggle', fxChain.saturation, document.getElementById('fx-saturation'));
bindFXToggle('fx-eq-toggle', fxChain.eq, document.getElementById('fx-eq'));
bindFXToggle('fx-chorus-toggle', fxChain.chorus, document.getElementById('fx-chorus'));
bindFXToggle('fx-delay-toggle', fxChain.delay, document.getElementById('fx-delay'));
bindFXToggle('fx-reverb-toggle', fxChain.reverb, document.getElementById('fx-reverb'));
bindFXToggle('fx-compressor-toggle', fxChain.compressor, document.getElementById('fx-compressor'));

// Saturation controls
document.getElementById('fx-sat-type').addEventListener('change', (e) => {
  fxChain.saturation.set({ type: e.target.value });
});
document.getElementById('fx-sat-drive').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-sat-drive-val').textContent = v;
  fxChain.saturation.set({ drive: v });
});
document.getElementById('fx-sat-output').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-sat-output-val').textContent = v.toFixed(2);
  fxChain.saturation.set({ output: v });
});
document.getElementById('fx-sat-tone').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-sat-tone-val').textContent = v + ' Hz';
  fxChain.saturation.set({ tone: v });
});
document.getElementById('fx-sat-mix').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-sat-mix-val').textContent = v.toFixed(2);
  fxChain.saturation.set({ mix: v });
});

// EQ controls
document.getElementById('fx-eq-hp').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-eq-hp-val').textContent = v + ' Hz';
  fxChain.eq.set({ hpFreq: v });
});
document.getElementById('fx-eq-band-freq').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-eq-band-freq-val').textContent = v + ' Hz';
  fxChain.eq.set({ bandFreq: v });
});
document.getElementById('fx-eq-band-gain').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-eq-band-gain-val').textContent = v + ' dB';
  fxChain.eq.set({ bandGain: v });
});
document.getElementById('fx-eq-band-q').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-eq-band-q-val').textContent = v.toFixed(1);
  fxChain.eq.set({ bandQ: v });
});
document.getElementById('fx-eq-shelf-freq').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-eq-shelf-freq-val').textContent = v + ' Hz';
  fxChain.eq.set({ shelfFreq: v });
});
document.getElementById('fx-eq-shelf-gain').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-eq-shelf-gain-val').textContent = v + ' dB';
  fxChain.eq.set({ shelfGain: v });
});

// Chorus controls
document.getElementById('fx-chorus-rate').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-chorus-rate-val').textContent = v.toFixed(1);
  fxChain.chorus.set({ rate: v });
});
document.getElementById('fx-chorus-depth').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-chorus-depth-val').textContent = v.toFixed(1);
  fxChain.chorus.set({ depth: v });
});
document.getElementById('fx-chorus-delay').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-chorus-delay-val').textContent = v.toFixed(1);
  fxChain.chorus.set({ delay: v });
});
document.getElementById('fx-chorus-spread').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-chorus-spread-val').textContent = v + '%';
  fxChain.chorus.set({ spread: v });
});
document.getElementById('fx-chorus-mix').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-chorus-mix-val').textContent = v.toFixed(2);
  fxChain.chorus.set({ mix: v });
});

// Delay controls
document.getElementById('fx-delay-time').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-delay-time-val').textContent = v;
  fxChain.delay.set({ time: v });
});
document.getElementById('fx-delay-feedback').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-delay-feedback-val').textContent = v.toFixed(2);
  fxChain.delay.set({ feedback: v });
});
document.getElementById('fx-delay-mix').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-delay-mix-val').textContent = v.toFixed(2);
  fxChain.delay.set({ mix: v });
});
document.getElementById('fx-delay-filter').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-delay-filter-val').textContent = v + ' Hz';
  fxChain.delay.set({ filterFreq: v });
});

// Delay ping-pong toggle
let delayPP = false;
document.getElementById('fx-delay-pp').addEventListener('click', () => {
  delayPP = !delayPP;
  const btn = document.getElementById('fx-delay-pp');
  btn.textContent = delayPP ? 'ON' : 'OFF';
  btn.classList.toggle('on', delayPP);
  btn.classList.toggle('off', !delayPP);
  fxChain.delay.set({ pingPong: delayPP });
});

// Reverb controls
document.getElementById('fx-reverb-size').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-reverb-size-val').textContent = v.toFixed(1);
  fxChain.reverb.set({ size: v });
});
document.getElementById('fx-reverb-predelay').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-reverb-predelay-val').textContent = v;
  fxChain.reverb.set({ preDelay: v });
});
document.getElementById('fx-reverb-damping').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-reverb-damping-val').textContent = v + ' Hz';
  fxChain.reverb.set({ damping: v });
});
document.getElementById('fx-reverb-mix').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-reverb-mix-val').textContent = v.toFixed(2);
  fxChain.reverb.set({ mix: v });
});

// Compressor controls
document.getElementById('fx-comp-threshold').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-comp-threshold-val').textContent = v + ' dB';
  fxChain.compressor.set({ threshold: v });
});
document.getElementById('fx-comp-ratio').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-comp-ratio-val').textContent = v.toFixed(1);
  fxChain.compressor.set({ ratio: v });
});
document.getElementById('fx-comp-attack').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-comp-attack-val').textContent = Math.round(v * 1000) + ' ms';
  fxChain.compressor.set({ attack: v });
});
document.getElementById('fx-comp-release').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-comp-release-val').textContent = Math.round(v * 1000) + ' ms';
  fxChain.compressor.set({ release: v });
});
document.getElementById('fx-comp-makeup').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  document.getElementById('fx-comp-makeup-val').textContent = v.toFixed(1) + ' dB';
  fxChain.compressor.set({ makeup: v });
});

// Receive handler
sync.onMessage((msg) => {
  if (msg.t === 'ctrl') {
    const el = document.getElementById(msg.id);
    if (!el) return;
    el.value = msg.v;
    // Update knob visual if this is a detune hidden input
    if (msg.id === 'detune1') detuneKnobs[0]?.setValue(parseFloat(msg.v));
    if (msg.id === 'detune2') detuneKnobs[1]?.setValue(parseFloat(msg.v));
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.dispatchEvent(new Event(evt, { bubbles: true }));
  } else if (msg.t === 'click') {
    const el = document.getElementById(msg.id);
    if (el) el.click();
  } else if (msg.t === 'adsr') {
    const adsr = engine.voices[msg.n].adsr;
    adsr.a = msg.a;
    adsr.d = msg.d;
    adsr.s = msg.s;
    adsr.r = msg.r;
    adsrGraphs[msg.n].draw();
  } else if (msg.t === 'filter') {
    engine.voices[msg.n].setFilterCutoff(msg.cutoff);
    engine.voices[msg.n].setFilterResonance(msg.q);
  } else if (msg.t === 'noteOn') {
    engine.noteOn(msg.f);
    keyboard.remoteNoteOn(msg.f);
  } else if (msg.t === 'noteOff') {
    engine.noteOff(msg.f);
    keyboard.remoteNoteOff(msg.f);
  }
});
