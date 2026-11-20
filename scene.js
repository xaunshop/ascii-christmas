'use strict';

// A little winter, rendered one character at a time.
const canvas = document.querySelector('#tree');
const ctx = canvas.getContext('2d');
const TAU = Math.PI * 2;
const GLYPHS = 'xvVXW%&#@o^+';
const CELL = { width: 5.6, height: 8.8 };
const GOLD = [255, 221, 124];
const RED = [248, 62, 79];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { time: reducedMotion ? 18 : 0, paused: reducedMotion };
const TIMING = { branches: 1.2, garland: 6.2, ornaments: 8.3,
  gifts: 9.7, lights: 10.5, star: 11.7, message: 13.3 };
const MESSAGE = 'MERRY CHRISTMAS 2026';
function smooth(value) {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}
let width = 0, height = 0, dpr = 1, last = 0, frame = 0;
let groundCache = null;
let seed = 2026;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const snow = Array.from({ length: 420 }, () => ({
  x: random(), y: random(), depth: .25 + random() * .75,
  speed: .015 + random() * .03, phase: random() * TAU,
}));
const needles = [];
const garland = [];
const lights = [];
const ornaments = [];
// Presents stand around the tree on one ground plane.
const gifts = [
  { width: 52, height: 70, depth: 45, color: RED, ribbon: GOLD },
  { width: 46, height: 66, depth: 43, color: [83, 103, 220], ribbon: GOLD },
  { width: 42, height: 55, depth: 42, color: [212, 161, 62], ribbon: RED },
  { width: 46, height: 62, depth: 42, color: [44, 156, 105], ribbon: GOLD },
  { width: 45, height: 68, depth: 44, color: RED, ribbon: [231, 224, 206] },
].map((gift, index) => {
  const angle = Math.PI / 10 + index * TAU / 5;
  return { ...gift, x: Math.cos(angle) * 232, z: Math.sin(angle) * 232 };
});

function radiusAt(y) {
  return 7 + 201 * Math.pow(y, .95);
}
function makeTree() {
  // A dense crown fills the silhouette with large, readable green characters.
  for (let row = 0; row < 100; row++) {
    const y = row / 99;
    const radius = radiusAt(y) * .93;
    for (let j = 0; j < Math.max(8, radius); j++) {
      needles.push({ y: y * 450, radius, angle: j / Math.max(8, radius) * TAU,
        glyph: GLYPHS[Math.floor(random() * GLYPHS.length)], birth: TIMING.branches + (1 - y) * 4.6,
        snowy: false, shade: .82 + random() * .22 });
    }
  }
  // Whorls of individual branches, with light tips and gently drooping needles.
  for (let tier = 0; tier < 25; tier++) {
    const y = .025 + tier / 24 * .96;
    const radius = radiusAt(y);
    const branches = Math.floor(7 + y * 12);
    for (let branch = 0; branch < branches; branch++) {
      const direction = branch / branches * TAU + tier * 2.39996;
      const length = radius * (.87 + random() * .16);
      const count = Math.floor(45 + length * .35);
      for (let j = 0; j < count; j++) {
        const reach = Math.pow(random(), .55);
        const side = (random() + random() - 1) * (3 + reach * 15);
        const radial = length * reach;
        const x = Math.cos(direction) * radial - Math.sin(direction) * side;
        const z = Math.sin(direction) * radial + Math.cos(direction) * side;
        needles.push({
          y: y * 450 - 7 * reach + 18 * reach * reach + (random() - .5) * 10,
          radius: Math.hypot(x, z), angle: Math.atan2(z, x),
          glyph: GLYPHS[Math.floor(random() * GLYPHS.length)],
          birth: TIMING.branches + (1 - y) * 4.6 + reach * .3,
          snowy: reach > .65 && random() < .055,
          shade: .84 + reach * .18 + random() * .16,
        });
      }
    }
  }
  for (let i = 0; i < 950; i++) {
    const progress = i / 949;
    const y = .98 - progress * .92;
    const angle = y * TAU * 3.6;
    garland.push({ y: y * 450 + Math.abs(Math.sin(angle * 2.5)) * 8,
      radius: radiusAt(y) + 13, angle,
      birth: TIMING.garland + progress * 2.1 });
  }
  for (let i = 0; i < 170; i++) {
    const y = .06 + i / 170 * .92;
    lights.push({ y: y * 450, radius: radiusAt(y) + 17,
      angle: i * 2.39996, phase: random() * TAU,
      birth: TIMING.lights + random() * 1.1 });
  }
  for (let i = 0; i < 27; i++) {
    const y = .17 + (i / 27) * .78;
    ornaments.push({ y: y * 450, radius: radiusAt(y) * .88 + 5,
      angle: i * 2.39996, size: 8 + y * 6,
      birth: TIMING.ornaments + (1 - y) * 1.5,
      color: i % 4 === 0 ? GOLD : RED });
  }
}
makeTree();

function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  dpr = Math.min(devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundCache = null;
}
new ResizeObserver(resize).observe(canvas);

// A snowy clearing on a horizontal plane. Cache its thousands of ASCII flakes.
function snowGround(scale, cx, top) {
  const surface = document.createElement('canvas');
  surface.width = canvas.width; surface.height = canvas.height;
  const paint = surface.getContext('2d');
  paint.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint.textAlign = 'center'; paint.textBaseline = 'middle';
  paint.font = `bold ${6.2 * scale}px monospace`;
  for (let z = -540; z <= 560; z += 30) {
    for (let x = -470; x <= 470; x += 4.5) {
      const r = Math.hypot(x / 440, z / 540);
      if (r > 1.14) continue;
      const wave = Math.sin(x * .021 + z * .018) * 1.8;
      const hash = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      const noise = hash - Math.floor(hash);
      const edge = 1 - smooth((r - .7) / .44);
      const shade = 1 - .18 * Math.exp(-(x * x / 13000 + z * z / 25000));
      const brightness = edge * shade * (.62 + .38 * Math.exp(-r * r * 1.3));
      const glyph = noise > .97 ? '*' : noise > .83 ? '+' : noise > .32 ? '-' : '·';
      paint.fillStyle = `rgba(218,231,243,${brightness * (.7 + noise * .3)})`;
      paint.fillText(glyph, cx + x * scale, top + (518 + z * .21 + wave) * scale);
    }
  }
  return surface;
}

function renderScene(time) {
  ctx.fillStyle = '#080d18';
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width / 540, (height - 35) / 650);
  const cx = width / 2;
  const top = (height - 650 * scale) / 2 + 48 * scale;
  const rotation = time * Math.PI / 10;
  const cellW = CELL.width * scale, cellH = CELL.height * scale;
  const pixels = new Map();
  const cos = Math.cos(rotation), sin = Math.sin(rotation);

  // A depth buffer keeps the back of the tree behind the branches.
  function put(x, y, z, glyph, color, glow = 0) {
    const col = Math.round(x / CELL.width);
    const row = Math.round(y / CELL.height);
    const key = col + ':' + row;
    if (!pixels.has(key) || pixels.get(key).z <= z) {
      pixels.set(key, { x: col, y: row, z, glyph, color, glow });
    }
  }
  function project(x, y, z) {
    const rx = x * cos + z * sin;
    const rz = z * cos - x * sin;
    return { x: rx, y: y + rz * .21, z: rz };
  }
  function rgb(color, brightness = 1) {
    return `rgb(${color.map(v => Math.min(255, Math.max(0, Math.round(v * brightness)))).join(',')})`;
  }

  // Snow falls at different speeds to give the scene depth.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const flake of snow) {
    const y = ((flake.y + time * flake.speed) % 1) * height;
    const x = ((flake.x + Math.sin(time * .3 + flake.phase) * .018 + 1) % 1) * width;
    ctx.font = `${(7 + flake.depth * 6) * Math.min(1, width / 550)}px monospace`;
    ctx.fillStyle = `rgba(220,232,247,${.2 + flake.depth * .7})`;
    ctx.fillText(flake.depth > .8 ? '+' : flake.depth > .6 ? '*' : '·', x, y);
  }

  // The dense white snowfield spreads around the base and behind the presents.
  if (!groundCache) groundCache = snowGround(scale, cx, top);
  ctx.drawImage(groundCache, 0, 0, width, height);

  // Branches grow from the bottom upward, with a brief white leading edge.
  for (let y = 435; y < 494; y += 5.5) {
    if (time < TIMING.branches + (494 - y) * .005) continue;
    for (let x = -13; x < 14; x += 6) put(x, y, -20, '#', '#886b45');
  }
  for (const p of needles) {
    const age = time - p.birth;
    if (age < 0) continue;
    const growth = .92 + .08 * smooth(age / .35);
    const a = p.angle - rotation;
    const radius = p.radius * growth;
    const z = Math.sin(a) * radius;
    const brightness = (.8 + .2 * (Math.sin(a - .4) + 1) / 2) * p.shade;
    const flash = 1 - smooth(age / .4);
    const green = p.snowy ? [222, 240, 230] : [106, 222, 126];
    const color = green.map(v => v * brightness * (1 - flash) + 235 * flash);
    put(Math.cos(a) * radius, p.y + z * .21 + 42, z,
      flash > .35 ? '#' : p.snowy ? '*' : p.glyph, rgb(color), flash * 5);
  }

  // The golden garland winds upward around the finished branches.
  for (const strand of garland) {
    const age = time - strand.birth;
    if (age < 0) continue;
    const a = strand.angle - rotation;
    const z = Math.sin(a) * strand.radius;
    const flash = 1 - smooth(age / .25);
    put(Math.cos(a) * strand.radius, strand.y + z * .21 + 42, z + 3,
      flash > .2 ? '#' : '~-=#@~'[Math.floor(strand.angle * 13) % 6],
      rgb([255, 233, 149], .92 + .08 * (Math.sin(a) + 1) / 2), 5 + flash * 8);
  }

  // Baubles appear one by one, from the lower branches to the tip.
  for (const ball of ornaments) {
    if (time < ball.birth) continue;
    const size = ball.size * smooth((time - ball.birth) / .35);
    if (size < 1) continue;
    const a = ball.angle - rotation;
    const z = Math.sin(a) * ball.radius;
    const x = Math.cos(a) * ball.radius;
    for (let dy = -size; dy <= size; dy += 3.5) {
      for (let dx = -size; dx <= size; dx += 3) {
        const distance = (dx * dx + dy * dy) / (size * size);
        if (distance > 1) continue;
        const shade = .55 + .45 * Math.sqrt(1 - distance);
        const highlight = Math.exp(-((dx / size + .3) ** 2 + (dy / size + .35) ** 2) * 28);
        const color = ball.color.map(v => v * shade + (255 - v * shade) * highlight * .8);
        put(x + dx, ball.y + 42 + z * .21 + dy,
          z + Math.sqrt(1 - distance) * size,
          highlight > .65 ? '*' : distance < .45 ? '@' : '%', rgb(color), 4);
      }
    }
  }

  // Each present sits outside the lower branches, on the same floor.
  // Near objects project downward; the tree occludes objects behind it.
  for (const [index, gift] of gifts.entries()) {
    const reveal = smooth((time - TIMING.gifts - index * .25) / .5);
    if (reveal === 0) continue;
    const bottom = 510;
    const top = bottom - gift.height * reveal;
    const halfW = gift.width / 2, halfD = gift.depth / 2;
    for (let face = 0; face < 5; face++) {
      const horizontal = face === 0 || face === 2 || face === 4 ? gift.width : gift.depth;
      const vertical = face === 4 ? gift.depth : gift.height * reveal;
      for (let u = -horizontal / 2; u <= horizontal / 2; u += 4) {
        for (let v = 0; v <= vertical; v += 5) {
          let x, y, z, nx = 0, nz = 0;
          if (face === 4) { x = u; y = top; z = v - halfD; }
          else {
            y = bottom - v;
            if (face === 0) { x = u; z = halfD; nz = 1; }
            if (face === 1) { x = halfW; z = u; nx = 1; }
            if (face === 2) { x = u; z = -halfD; nz = -1; }
            if (face === 3) { x = -halfW; z = u; nx = -1; }
          }
          const normalZ = nz * cos - nx * sin;
          if (face !== 4 && normalZ <= 0) continue;
          const point = project(x + gift.x, y, z + gift.z);
          // Broad vertical straps and a horizontal belt meet on every side.
          const ribbon = Math.abs(u) <= 5.5 || (face === 4
            ? Math.abs(z) <= 5.5
            : Math.abs(y - (bottom - gift.height * .5)) <= 5);
          const brightness = face === 4 ? 1 : .82 + .18 * normalZ;
          const glyphs = ribbon ? '##=' : '%#@%';
          const glyphIndex = Math.abs(Math.round(u / 4) + Math.round(v / 5) * 3 + face) % glyphs.length;
          put(point.x, point.y, point.z, glyphs[glyphIndex],
            rgb(ribbon ? gift.ribbon : gift.color, ribbon ? 1 : brightness), ribbon ? 2 : 0);
        }
      }
    }

    // Four folded ribbon loops make a bow that stays visible as the box turns.
    const bowReveal = smooth((time - TIMING.gifts - index * .25 - .45) / .4);
    if (bowReveal > 0) {
      const lid = bottom - gift.height;
      const silk = gift.ribbon.map(v => Math.round(v * .78 + 255 * .22));
      function bowPoint(x, y, z, glyph, highlight = false) {
        const point = project(gift.x + x * bowReveal, lid + y * bowReveal,
          gift.z + z * bowReveal);
        put(point.x, point.y, point.z + 1.5, glyph,
          rgb(highlight ? silk : gift.ribbon), 3);
      }
      for (let loop = 0; loop < 4; loop++) {
        const angle = loop * Math.PI / 2 + Math.PI / 4;
        const dx = Math.cos(angle), dz = Math.sin(angle);
        for (let t = 0; t < TAU; t += .1) {
          const reach = 10 * (1 - Math.cos(t));
          const lift = -5 - 8 * (1 - Math.cos(t)) + 6 * Math.sin(t);
          for (let edge = -2.5; edge <= 2.5; edge += 2.5) {
            bowPoint(dx * reach - dz * edge, lift, dz * reach + dx * edge,
              t < Math.PI ? '@' : '#', t < Math.PI);
          }
        }
      }
      // Two short tails lie across the lid below the bow.
      for (const side of [-1, 1]) {
        for (let t = 0; t <= 1; t += .08) {
          for (let edge = -2.5; edge <= 2.5; edge += 2.5) {
            bowPoint(side * (4 + t * 15) + edge, -2 - Math.sin(t * Math.PI) * 4,
              side * (3 + t * 12), '=', true);
          }
        }
      }
      // A bright central knot joins the loops and the crossed straps.
      for (let x = -4; x <= 4; x += 3) {
        for (let z = -4; z <= 4; z += 3) bowPoint(x, -8, z, '#', true);
      }
    }
  }

  // The small lights switch on after the decorations are in place.
  for (const light of lights) {
    if (time < light.birth) continue;
    const a = light.angle - rotation;
    const z = Math.sin(a) * light.radius;
    const flicker = .65 + .35 * Math.sin(time * 2 + light.phase) ** 2;
    put(Math.cos(a) * light.radius, light.y + z * .21 + 42, z + 4,
      flicker > .83 ? 'o' : '*', rgb([255, 236, 172], flicker), z > 0 ? 13 : 0);
  }

  // Opaque character cells keep the snow behind the tree and its presents.
  ctx.fillStyle = '#080d18';
  for (const p of pixels.values()) {
    ctx.fillRect(cx + p.x * cellW - cellW / 2, top + p.y * cellH - cellH / 2,
      cellW + .3, cellH + .3);
  }
  ctx.font = `500 ${10 * scale}px "SFMono-Regular", Consolas, monospace`;
  for (const p of pixels.values()) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.glow * scale;
    ctx.fillText(p.glyph, cx + p.x * cellW, top + p.y * cellH);
  }
  ctx.shadowBlur = 0;

  // The star ignites last, with a white flash that settles into gold.
  if (time >= TIMING.star) {
    const ignition = smooth((time - TIMING.star) / .35);
    const flash = Math.max(0, 1 - (time - TIMING.star) / 1.1) ** 2;
    const starY = top + 19 * scale;
    const pulse = .9 + .1 * Math.sin(time * 2.4);
    const halo = ctx.createRadialGradient(cx, starY, 0, cx, starY, 80 * scale);
    halo.addColorStop(0, 'rgba(255,222,119,.22)');
    halo.addColorStop(.3, 'rgba(255,208,86,.09)');
    halo.addColorStop(1, 'rgba(255,208,86,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - 80 * scale, starY - 80 * scale, 160 * scale, 160 * scale);
    ctx.font = `${8 * scale}px monospace`;
    const vertices = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = (i % 2 === 0 ? 31 : 13) * ignition;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    function inside(x, y) {
      let hit = false;
      for (let i = 0, j = 9; i < 10; j = i++) {
        const [xi, yi] = vertices[i], [xj, yj] = vertices[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    }
    ctx.fillStyle = rgb(GOLD.map(v => v + (255 - v) * flash), pulse);
    ctx.shadowColor = '#ffe7a0';
    ctx.shadowBlur = (13 + 24 * flash) * scale;
    for (let y = -30; y <= 30; y += 5.5) {
      for (let x = -30; x <= 30; x += 4) {
        if (inside(x, y)) ctx.fillText(Math.abs(x) < 9 ? '@' : '*', cx + x * scale, starY + y * scale);
      }
    }
    ctx.shadowBlur = 0;
    // Fine rays are characters too, keeping the entire star in the ASCII grid.
    ctx.font = `${7 * scale}px monospace`;
    for (let ray = 0; ray < 8; ray++) {
      const angle = ray * Math.PI / 4;
      const extent = ray % 2 === 0 ? 90 : 64;
      for (let distance = 37; distance < extent; distance += 7) {
        const fade = (1 - distance / extent) * (.7 + flash * .3);
        ctx.fillStyle = `rgba(255,223,133,${fade})`;
        const glyph = ray % 4 === 0 ? '-' : ray % 4 === 2 ? '|' : ray % 4 === 1 ? '\\' : '/';
        ctx.fillText(glyph, cx + Math.cos(angle) * distance * scale,
          starY + Math.sin(angle) * distance * scale);
      }
    }
  }

  // The greeting is typed only when the entire tree is complete.
  const shown = Math.min(MESSAGE.length, Math.max(0, Math.floor((time - TIMING.message) * 7)));
  const spacing = 15 * scale;
  if (shown > 0) {
    ctx.fillStyle = 'rgba(8,13,24,.92)';
    ctx.fillRect(cx - MESSAGE.length * spacing / 2 - 5 * scale, top + 580 * scale,
      MESSAGE.length * spacing + 10 * scale, 19 * scale);
  }
  ctx.font = `${11 * scale}px monospace`;
  for (let i = 0; i < shown; i++) {
    const color = [RED, GOLD, [92, 185, 123]][Math.floor(i / 2 + time * .6) % 3];
    ctx.fillStyle = rgb(color, .85 + .15 * Math.sin(time * 3 + i));
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 5 * scale;
    ctx.fillText(MESSAGE[i], cx + (i - (MESSAGE.length - 1) / 2) * spacing, top + 590 * scale);
  }
  ctx.shadowBlur = 0;
}

function togglePause() { state.paused = !state.paused; }
function restart() {
  state.time = 0; state.paused = false; last = 0;
  renderScene(0);
}
let toastTimer;
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message;
  el.classList.add('visible'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
}
function capture() {
  const picture = document.createElement('canvas');
  picture.width = canvas.width; picture.height = canvas.height;
  const paint = picture.getContext('2d'); paint.drawImage(canvas, 0, 0);
  const a = document.createElement('a');
  a.download = 'ascii-christmas-2026.png'; a.href = picture.toDataURL('image/png'); a.click();
  toast('Картинка сохранена');
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else toast('Полноэкранный режим недоступен в этом браузере');
  } catch { toast('Не удалось включить полноэкранный режим'); }
}
canvas.addEventListener('click', togglePause);
window.addEventListener('keydown', event => {
  if (event.altKey || event.metaKey || event.ctrlKey || event.repeat) return;
  if (event.code === 'Space') { event.preventDefault(); togglePause(); }
  if (event.code === 'KeyR') restart();
  if (event.code === 'KeyS') capture();
  if (event.code === 'KeyF') fullscreen();
});
document.addEventListener('visibilitychange', () => { last = 0; });
function animate(now) {
  requestAnimationFrame(animate);
  if (now - frame < 1000 / 30 - .5) return;
  const delta = last ? Math.min((now - last) / 1000, .1) : 0;
  last = now; frame = now;
  if (!state.paused && !document.hidden) state.time += delta;
  renderScene(state.time);
}
resize(); requestAnimationFrame(animate);
