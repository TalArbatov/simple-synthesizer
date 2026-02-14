export function createKnob(canvas, hiddenInput, opts) {
  const ctx = canvas.getContext('2d');
  const { min, max, step, onChange } = opts;
  let value = opts.value ?? 0;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 6;

  // Arc sweep: 270° with gap at bottom
  const startAngle = Math.PI * 0.75;   // 135°
  const endAngle = Math.PI * 2.25;     // 405° (= 45°)
  const sweep = endAngle - startAngle; // 270°

  function valueFrac() {
    return (value - min) / (max - min);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Track (background arc)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = '#2a2a34';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    const frac = valueFrac();
    const valAngle = startAngle + frac * sweep;
    if (frac > 0.001) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, valAngle);
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Indicator dot
    const dotX = cx + Math.cos(valAngle) * radius;
    const dotY = cy + Math.sin(valAngle) * radius;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00d2ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center label
    ctx.fillStyle = '#5a5a65';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(value), cx, cy);
  }

  function setValue(v) {
    value = Math.max(min, Math.min(max, v));
    // Snap to step
    value = Math.round(value / step) * step;
    draw();
  }

  function commitValue() {
    hiddenInput.value = value;
    hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
    if (onChange) onChange(value);
  }

  // --- Mouse interaction ---
  let dragging = false;
  let dragStartY = 0;
  let dragStartValue = 0;

  function canvasPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (w / r.width),
      y: (clientY - r.top) * (h / r.height)
    };
  }

  canvas.addEventListener('mousedown', e => {
    dragging = true;
    dragStartY = e.clientY;
    dragStartValue = value;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dy = dragStartY - e.clientY; // up = positive
    const range = max - min;
    const sensitivity = range / 150; // 150px for full range
    setValue(dragStartValue + dy * sensitivity);
    commitValue();
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      canvas.style.cursor = 'grab';
    }
  });

  // --- Touch interaction ---
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    dragging = true;
    dragStartY = t.clientY;
    dragStartValue = value;
    e.preventDefault();
  });

  canvas.addEventListener('touchmove', e => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    const dy = dragStartY - t.clientY;
    const range = max - min;
    const sensitivity = range / 150;
    setValue(dragStartValue + dy * sensitivity);
    commitValue();
  });

  window.addEventListener('touchend', () => {
    dragging = false;
  });

  // Initialize
  hiddenInput.value = value;
  draw();

  return { draw, setValue };
}
