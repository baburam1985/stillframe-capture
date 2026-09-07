export function renderEdits(source, operations, makeCanvas) {
  let canvas = makeCanvas(source.width, source.height);
  let ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);
  for (const op of operations) {
    if (op.type === 'crop') {
      const next = makeCanvas(op.width, op.height);
      next.getContext('2d').drawImage(canvas, op.x, op.y, op.width, op.height, 0, 0, op.width, op.height);
      canvas.width = 1;
      canvas.height = 1;
      canvas = next;
      ctx = canvas.getContext('2d');
      continue;
    }
    ctx.save();
    if (op.type === 'redact') {
      // Opaque integer-aligned pixels, flattened into the exported image.
      ctx.fillStyle = '#172d32';
      ctx.fillRect(op.x, op.y, op.width, op.height);
    } else {
      ctx.strokeStyle = '#d34928';
      ctx.fillStyle = '#d34928';
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 350));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (op.type === 'box') {
        const inset = ctx.lineWidth / 2;
        ctx.strokeRect(op.x + inset, op.y + inset, Math.max(0, op.width - 2 * inset), Math.max(0, op.height - 2 * inset));
      } else if (op.type === 'arrow') {
        const { from, to } = op;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const head = Math.min(Math.hypot(to.x - from.x, to.y - from.y) / 2, ctx.lineWidth * 5);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
  return canvas;
}
