// High performance lightweight canvas confetti effect with zero external dependencies
export function triggerConfetti() {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#f59e0b', '#8b5cf6', '#38bdf8', '#10b981', '#ec4899', '#ffffff'];
  const particleCount = 100;
  const particles = Array.from({ length: particleCount }).map(() => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
    y: canvas.height * 0.6,
    vx: (Math.random() - 0.5) * 16,
    vy: -(Math.random() * 14 + 8),
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    alpha: 1
  }));

  let animationId = 0;
  const gravity = 0.45;
  const drag = 0.985;
  let frames = 0;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.alpha -= 0.009;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    frames++;
    if (alive && frames < 180) {
      animationId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationId);
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    }
  }

  render();
}
