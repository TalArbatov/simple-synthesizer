/**
 * requestAnimationFrame loop that drives LFO modulation computation
 * (filter cutoff + master volume) and redraws all visual components.
 */

import type { AudioEngine } from './audio-engine.js';
import type { LFO } from './lfo.js';
import type { Drawable } from './types.js';
import { getKnob } from './knob-registry.js';

/**
 * Start the animation loop.
 * @param engine               Audio engine
 * @param lfos                 2D LFO array [oscIndex][lfoIndex]
 * @param drawList             Mutable list of drawables (filter graphs are added asynchronously)
 * @param getBaseMasterVolume  Returns the un-modulated master volume set by the user
 */
export function startAnimationLoop(
  engine: AudioEngine,
  lfos: LFO[][],
  drawList: Drawable[],
  getBaseMasterVolume: () => number
): void {
  const masterVolumeVal = document.getElementById('master-volume-val')!;

  function animate(): void {
    requestAnimationFrame(animate);

    const now = performance.now() / 1000;
    let masterVolMod = 0;
    for (let i = 0; i < 2; i++) {
      const voice = engine.voices[i];
      let filterMod = 0;
      let hasFilterTarget = false;
      for (let j = 0; j < 4; j++) {
        const lfo = lfos[i][j];
        const val = lfo.getValue(now);
        if (lfo.hasTarget('filter')) {
          hasFilterTarget = true;
          filterMod += val;
        }
        if (lfo.hasTarget('volume')) masterVolMod += val;
      }
      if (hasFilterTarget) {
        voice.applyModulatedCutoff(voice.cutoff * Math.pow(2, filterMod * 3));
      } else {
        voice.applyModulatedCutoff(voice.cutoff);
      }
    }

    const baseMasterVolume = getBaseMasterVolume();
    const modVol = Math.max(0, Math.min(1, baseMasterVolume * (1 + masterVolMod)));
    engine.masterGain.gain.setValueAtTime(modVol, engine.audioCtx.currentTime);
    getKnob('master-volume')?.setValue(modVol);
    masterVolumeVal.textContent = modVol.toFixed(2);

    for (const item of drawList) {
      item.draw();
    }
  }

  animate();
}
