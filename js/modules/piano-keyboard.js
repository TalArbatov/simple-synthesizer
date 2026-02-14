import { KEY_MAP } from './constants.js';
import { buildKeys, findKeyByName } from './notes.js';

export function createPianoKeyboard(canvas, { onNoteOn, onNoteOff }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const keys = buildKeys();
  const whites = keys.filter(k => !k.black);
  const blacks = keys.filter(k => k.black);
  const whiteW = W / whites.length;
  const blackW = whiteW * 0.6;
  const blackH = H * 0.6;

  whites.forEach((k, i) => {
    k.x = i * whiteW; k.y = 0; k.w = whiteW; k.h = H;
  });

  let whiteIdx = 0;
  keys.forEach(k => {
    if (!k.black) {
      whiteIdx++;
    } else {
      k.x = whiteIdx * whiteW - blackW / 2;
      k.y = 0;
      k.w = blackW;
      k.h = blackH;
    }
  });

  let activeNote = null;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const k of whites) {
      const active = activeNote && activeNote.freq === k.freq;
      ctx.fillStyle = active ? '#e94560' : '#f0f0f0';
      ctx.fillRect(k.x, k.y, k.w, k.h);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(k.x, k.y, k.w, k.h);

      ctx.fillStyle = active ? '#fff' : '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(k.note + k.octave, k.x + k.w / 2, k.h - 10);
    }

    for (const k of blacks) {
      const active = activeNote && activeNote.freq === k.freq;
      ctx.fillStyle = active ? '#e94560' : '#222';
      ctx.fillRect(k.x, k.y, k.w, k.h);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(k.x, k.y, k.w, k.h);
    }

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 8);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function keyAtPos(x, y) {
    for (const k of blacks) {
      if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) return k;
    }
    for (const k of whites) {
      if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) return k;
    }
    return null;
  }

  function canvasPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (W / r.width),
      y: (clientY - r.top) * (H / r.height)
    };
  }

  function activate(k) {
    activeNote = k;
    onNoteOn(k.freq);
  }

  function deactivate() {
    activeNote = null;
    onNoteOff();
  }

  // Mouse interaction
  let mouseDown = false;

  canvas.addEventListener('mousedown', e => {
    mouseDown = true;
    const { x, y } = canvasPos(e.clientX, e.clientY);
    const k = keyAtPos(x, y);
    if (k) activate(k);
  });

  canvas.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    const { x, y } = canvasPos(e.clientX, e.clientY);
    const k = keyAtPos(x, y);
    if (k && (!activeNote || k.freq !== activeNote.freq)) activate(k);
  });

  canvas.addEventListener('mouseup', () => { mouseDown = false; deactivate(); });
  canvas.addEventListener('mouseleave', () => { if (mouseDown) { mouseDown = false; deactivate(); } });

  // Touch support
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = canvasPos(t.clientX, t.clientY);
    const k = keyAtPos(x, y);
    if (k) activate(k);
  });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = canvasPos(t.clientX, t.clientY);
    const k = keyAtPos(x, y);
    if (k && (!activeNote || k.freq !== activeNote.freq)) activate(k);
  });

  canvas.addEventListener('touchend', e => { e.preventDefault(); deactivate(); });

  // Computer keyboard mapping
  const heldKeys = new Set();

  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const id = KEY_MAP[e.key.toLowerCase()];
    if (!id) return;
    heldKeys.add(e.key.toLowerCase());
    const k = findKeyByName(keys, id);
    if (k) activate(k);
  });

  document.addEventListener('keyup', e => {
    const lower = e.key.toLowerCase();
    if (!KEY_MAP[lower]) return;
    heldKeys.delete(lower);
    if (heldKeys.size === 0) {
      deactivate();
    } else {
      const last = [...heldKeys].pop();
      const k = findKeyByName(keys, KEY_MAP[last]);
      if (k) activate(k);
    }
  });

  draw();
  return { draw };
}
