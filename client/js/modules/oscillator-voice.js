export class OscillatorVoice {
  constructor(audioCtx, destination) {
    this.audioCtx = audioCtx;
    this.destination = destination;

    // Reference filter for visualization (not connected to audio graph)
    this.filter = audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;

    this.activeNotes = new Map(); // freq -> { oscillator, filter, gainNode }
    this.enabled = true;
    this.volume = 0.5;
    this.waveform = 'sawtooth';
    this.detune = 0;
    this.adsr = { a: 0.05, d: 0.12, s: 0.7, r: 0.3 };
    this.filterType = 'lowpass';
    this.filterEnabled = true;
    this.cutoff = 2000;
    this.resonance = 1;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      for (const note of this.activeNotes.values()) {
        note.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
    }
  }

  setWaveform(waveform) {
    this.waveform = waveform;
    for (const note of this.activeNotes.values()) {
      note.oscillator.type = waveform;
    }
  }

  setDetune(cents) {
    this.detune = cents;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      note.oscillator.detune.setValueAtTime(cents, now);
    }
  }

  setVolume(vol) {
    this.volume = vol;
  }

  setFilterEnabled(enabled) {
    this.filterEnabled = enabled;
    for (const note of this.activeNotes.values()) {
      note.oscillator.disconnect();
      note.filter.disconnect();
      if (enabled) {
        note.oscillator.connect(note.filter);
        note.filter.connect(note.gainNode);
      } else {
        note.oscillator.connect(note.gainNode);
      }
    }
  }

  setFilterType(type) {
    this.filterType = type;
    this.filter.type = type;
    for (const note of this.activeNotes.values()) {
      note.filter.type = type;
    }
  }

  setFilterCutoff(freq) {
    this.cutoff = freq;
    this.filter.frequency.value = freq;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      note.filter.frequency.setValueAtTime(freq, now);
    }
  }

  setFilterResonance(q) {
    this.resonance = q;
    this.filter.Q.value = q;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      note.filter.Q.setValueAtTime(q, now);
    }
  }

  noteOn(freq) {
    if (!this.enabled) return;

    // If this note is already playing, release it first
    if (this.activeNotes.has(freq)) {
      this.noteOff(freq);
    }

    const now = this.audioCtx.currentTime;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = this.filterType;
    filter.frequency.setValueAtTime(this.cutoff, now);
    filter.Q.setValueAtTime(this.resonance, now);

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = 0;

    const oscillator = this.audioCtx.createOscillator();
    oscillator.type = this.waveform;
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.detune.setValueAtTime(this.detune, now);

    if (this.filterEnabled) {
      oscillator.connect(filter);
      filter.connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }
    gainNode.connect(this.destination);
    oscillator.start(now);

    // ADSR attack + decay
    const g = gainNode.gain;
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(this.volume, now + this.adsr.a);
    g.linearRampToValueAtTime(this.volume * this.adsr.s, now + this.adsr.a + this.adsr.d);

    this.activeNotes.set(freq, { oscillator, filter, gainNode });
  }

  noteOff(freq) {
    const note = this.activeNotes.get(freq);
    if (!note) return;

    const now = this.audioCtx.currentTime;
    const releaseTime = this.enabled ? this.adsr.r : 0;

    const g = note.gainNode.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + releaseTime);

    this.activeNotes.delete(freq);

    setTimeout(() => {
      try {
        note.oscillator.stop();
        note.oscillator.disconnect();
        note.filter.disconnect();
        note.gainNode.disconnect();
      } catch(e) {}
    }, releaseTime * 1000 + 100);
  }
}
