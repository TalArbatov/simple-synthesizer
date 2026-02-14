export class OscillatorVoice {
  constructor(audioCtx, destination) {
    this.audioCtx = audioCtx;
    this.gainNode = audioCtx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(destination);

    this.oscillator = null;
    this.enabled = true;
    this.volume = 0.5;
    this.waveform = 'sawtooth';
    this.detune = 0;
    this.adsr = { a: 0.05, d: 0.12, s: 0.7, r: 0.3 };
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
  }

  setWaveform(waveform) {
    this.waveform = waveform;
    if (this.oscillator) this.oscillator.type = waveform;
  }

  setDetune(cents) {
    this.detune = cents;
    if (this.oscillator) {
      this.oscillator.detune.setValueAtTime(cents, this.audioCtx.currentTime);
    }
  }

  setVolume(vol) {
    this.volume = vol;
  }

  noteOn(freq) {
    if (!this.enabled) return;
    const now = this.audioCtx.currentTime;

    if (this.oscillator) {
      this.oscillator.frequency.setValueAtTime(freq, now);
    } else {
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = this.waveform;
      this.oscillator.frequency.setValueAtTime(freq, now);
      this.oscillator.detune.setValueAtTime(this.detune, now);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start(now);
    }

    const g = this.gainNode.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(this.volume, now + this.adsr.a);
    g.linearRampToValueAtTime(this.volume * this.adsr.s, now + this.adsr.a + this.adsr.d);
  }

  noteOff() {
    if (!this.oscillator) return 0;
    const now = this.audioCtx.currentTime;

    if (this.enabled) {
      const g = this.gainNode.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + this.adsr.r);
    } else {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
    }

    const releaseTime = this.enabled ? this.adsr.r : 0;
    const osc = this.oscillator;
    this.oscillator = null;
    setTimeout(() => {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    }, releaseTime * 1000 + 100);

    return releaseTime;
  }
}
