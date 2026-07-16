// ===================== 飞机大战 - Aircraft Battle =====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = 480, H = 700;

// ===================== 音效 (Web Audio API) =====================
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, dur, type = "square", vol = 0.15) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* silent */ }
}
function playNoise(dur, vol = 0.2) {
  try {
    initAudio();
    const sr = audioCtx.sampleRate;
    const len = sr * dur;
    const buf = audioCtx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / len);
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.value = vol;
    src.connect(gain); gain.connect(audioCtx.destination);
    src.start();
  } catch (e) { /* silent */ }
}
const SFX = {
  shoot: () => playTone(880, 0.08, "square", 0.1),
  explode: () => playNoise(0.2, 0.25),
  hit: () => playTone(220, 0.15, "sawtooth", 0.2),
  powerup: () => playTone(660, 0.2, "sawtooth", 0.15),
  gameOver: () => playTone(150, 0.6, "sawtooth", 0.25),
};
// ===================== 星空背景 =====================
class StarField {
  constructor() {
    this.stars = [];
    for (let i = 0; i < 100; i++) this.stars.push(this._makeStar());
  }
  _makeStar() {
    return { x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 2.5, r: 1 + Math.random() * 2, b: 100 + Math.random() * 155 };
  }
  update() {
    for (const s of this.stars) {
      s.y += s.s;
      if (s.y > H) { s.y = -5; s.x = Math.random() * W; }
    }
  }
  draw(ctx) {
    for (const s of this.stars) {
      ctx.fillStyle = `rgb(${s.b},${s.b},${s.b})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ===================== 玩家 =====================
class Player {
  constructor() {
    this.x = W / 2; this.y = H - 70;
    this.w = 40; this.h = 50;
    this.speed = 5; this.hp = 100; this.maxHp = 100;
    this.power = 1; this.shootDelay = 200; this.lastShot = 0;
    this.invTimer = 0; this.invDur = 2000;
  }
  update(keys, time) {
    let dx = 0, dy = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) dx = -this.speed;
    if (keys["ArrowRight"] || keys["KeyD"]) dx = this.speed;
    if (keys["ArrowUp"] || keys["KeyW"]) dy = -this.speed;
    if (keys["ArrowDown"] || keys["KeyS"]) dy = this.speed;
    this.x += dx; this.y += dy;
    this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x));
    this.y = Math.max(this.h / 2, Math.min(H - this.h / 2, this.y));

    if (keys["Space"] && time - this.lastShot > this.shootDelay) {
      this.lastShot = time; return true;
    }
    return false;
  }
  getShootPos() {
    const cx = this.x, top = this.y - this.h / 2;
    if (this.power === 1) return [[cx, top + 5]];
    if (this.power === 2) return [[cx - 8, top + 10], [cx + 8, top + 10]];
    if (this.power === 3) return [[cx, top + 5], [cx - 12, top + 15], [cx + 12, top + 15]];
    return [[cx, top], [cx - 15, top + 10], [cx + 15, top + 10], [cx - 8, top + 20], [cx + 8, top + 20]];
  }
  takeDamage(amount) {
    if (this.invTimer > 0 && time() - this.invTimer < this.invDur) return false;
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; return true; }
    this.invTimer = time(); return false;
  }
  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  powerUp() { this.power = Math.min(4, this.power + 1); }
  reset() {
    this.x = W / 2; this.y = H - 70;
    this.hp = this.maxHp; this.power = 1; this.invTimer = time();
  }
  draw(ctx) {
    const t = time();
    if (this.invTimer > 0 && t - this.invTimer < this.invDur) {
      if (Math.floor(t / 100) % 2 === 0) { ctx.globalAlpha = 0.3; }
    }
    const cx = this.x, cy = this.y;
    // Fuselage
    ctx.fillStyle = "#46aaff";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx - 18, cy + 20); ctx.lineTo(cx - 8, cy + 20);
    ctx.lineTo(cx, cy + 25); ctx.lineTo(cx + 8, cy + 20);
    ctx.lineTo(cx + 18, cy + 20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#7ac4ff"; ctx.lineWidth = 2; ctx.stroke();
    // Wings
    ctx.fillStyle = "#2a7ac8";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 20, cy + 22);
    ctx.lineTo(cx + 20, cy + 22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#5aa0e0"; ctx.stroke();
    // Cockpit
    ctx.fillStyle = "#80d4ff";
    ctx.beginPath(); ctx.ellipse(cx, cy - 8, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#30c0ff";
    ctx.beginPath(); ctx.ellipse(cx, cy - 7, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  drawHUD(ctx) {
    const bw = 200, bh = 12, bx = (W - bw) / 2, by = H - 30;
    ctx.fillStyle = "#1a1a28"; ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.stroke();
    const ratio = this.hp / this.maxHp;
    if (ratio > 0) {
      ctx.fillStyle = ratio > 0.6 ? "#3f6" : ratio > 0.3 ? "#fc0" : "#f44";
      ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, (bw - 4) * ratio, bh - 4, 3); ctx.fill();
    }
    ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`HP: ${this.hp}/${this.maxHp}`, W / 2, by + bh - 1);
  }
}
// ===================== 子弹 =====================
class Bullet {
  constructor(x, y, speed = -12, isEnemy = false, damage = 10) {
    this.x = x; this.y = y; this.speed = speed;
    this.isEnemy = isEnemy; this.damage = damage;
    this.w = isEnemy ? 6 : 8; this.h = isEnemy ? 12 : 16;
    this.alive = true;
  }
  update() {
    this.y += this.speed;
    if (this.y < -20 || this.y > H + 20) this.alive = false;
  }
  draw(ctx) {
    if (this.isEnemy) {
      ctx.fillStyle = "#f44";
      ctx.fillRect(this.x - 3, this.y - 6, 6, 12);
      ctx.fillStyle = "#faa";
      ctx.fillRect(this.x - 2, this.y - 5, 4, 10);
    } else {
      const grad = ctx.createLinearGradient(this.x, this.y - 8, this.x, this.y + 8);
      grad.addColorStop(0, "#fff"); grad.addColorStop(0.4, "#8cf"); grad.addColorStop(1, "#48f");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(this.x - 3, this.y - 8, 6, 16, 3); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(this.x - 1.5, this.y - 4, 3, 8);
    }
  }
}

// ===================== 敌机 =====================
class Enemy {
  constructor(x, y, hp = 20, speed = 3, score = 100) {
    this.x = x; this.y = y; this.hp = hp; this.maxHp = hp;
    this.speed = speed; this.score = score;
    this.lastShot = 0; this.shootDelay = 1000 + Math.random() * 2000;
    this.canShoot = true; this.alive = true;
    this.type = "basic"; this.w = 30; this.h = 30;
    this.flashTimer = 0;
  }
  update(time) {
    this.y += this.speed;
    if (this.y > H + 30) this.alive = false;
  }
  takeDamage(dmg) {
    this.hp -= dmg; this.flashTimer = time();
    return this.hp <= 0;
  }
  shouldShoot(time) {
    if (!this.canShoot) return false;
    if (time - this.lastShot > this.shootDelay) {
      this.lastShot = time; this.shootDelay = 800 + Math.random() * 2200;
      return true;
    }
    return false;
  }
  draw(ctx) {
    const cx = this.x, cy = this.y;
    ctx.save();
    if (this.flashTimer > 0 && time() - this.flashTimer < 80) {
      ctx.fillStyle = "#fff";
    } else {
      ctx.fillStyle = this._getColor();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy + 15);
    ctx.lineTo(cx - 14, cy - 12); ctx.lineTo(cx + 14, cy - 12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = this._getBorder(); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  _getColor() { return "#c44"; }
  _getBorder() { return "#e66"; }
}

class EnemyBasic extends Enemy {
  constructor(x, y) { super(x, y, 15, 2, 100); this.w = 32; this.h = 32; }
  draw(ctx) {
    const cx = this.x, cy = this.y;
    ctx.save();
    if (this.flashTimer > 0 && time() - this.flashTimer < 80) {
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff";
    } else {
      ctx.fillStyle = "#c44"; ctx.strokeStyle = "#e66";
    }
    ctx.beginPath(); ctx.moveTo(cx, cy + 16);
    ctx.lineTo(cx - 14, cy - 12); ctx.lineTo(cx + 14, cy - 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle = ctx.fillStyle === "#fff" ? "#fff" : "#a33";
    ctx.beginPath(); ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx - 16, cy + 12); ctx.lineTo(cx + 16, cy + 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (ctx.fillStyle !== "#fff") {
      ctx.fillStyle = "#ff0"; ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 5, cy - 2, 2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

class EnemyFast extends Enemy {
  constructor(x, y) { super(x, y, 10, 5, 150); this.w = 28; this.h = 28; this.startX = x; }
  update(time) {
    this.y += this.speed;
    this.x = this.startX + Math.sin(this.y * 0.05) * 30;
    if (this.y > H + 30) this.alive = false;
  }
  draw(ctx) {
    const cx = this.x, cy = this.y;
    ctx.save();
    ctx.fillStyle = this.flashTimer > 0 && time() - this.flashTimer < 80 ? "#fff" : "#cc0";
    ctx.strokeStyle = ctx.fillStyle === "#fff" ? "#fff" : "#ee2";
    ctx.beginPath(); ctx.moveTo(cx, cy + 14);
    ctx.lineTo(cx - 12, cy - 12); ctx.lineTo(cx + 12, cy - 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#f80";
    ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 14);
    ctx.stroke();
    ctx.restore();
  }
}

class EnemyTank extends Enemy {
  constructor(x, y) { super(x, y, 60, 1, 300); this.w = 44; this.h = 44; }
  draw(ctx) {
    const cx = this.x, cy = this.y;
    ctx.save();
    if (this.flashTimer > 0 && time() - this.flashTimer < 80) {
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff";
    } else {
      ctx.fillStyle = "#84a"; ctx.strokeStyle = "#a6c";
    }
    ctx.beginPath(); ctx.moveTo(cx, cy + 22);
    ctx.lineTo(cx - 20, cy - 18); ctx.lineTo(cx + 20, cy - 18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ctx.fillStyle === "#fff" ? "#fff" : "#628";
    ctx.beginPath(); ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx - 22, cy + 16); ctx.lineTo(cx + 22, cy + 16);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (ctx.fillStyle !== "#fff") {
      ctx.fillStyle = "#f44"; ctx.beginPath(); ctx.arc(cx, cy - 4, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff0"; ctx.beginPath(); ctx.arc(cx, cy - 4, 2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

class EnemyBoss extends Enemy {
  constructor(x, y, level = 1) {
    super(x, y, 200 + level * 100, 1, 1000);
    this.w = 80; this.h = 70; this.dir = 1; this.level = level;
    this.shootDelay = 800; this.startY = 60;
  }
  update(time) {
    this.x += this.speed * this.dir;
    if (this.x > W - 50) this.dir = -1;
    if(this.x < 50) this.dir = 1;
    if (this.y < this.startY) this.y += 1;
    if (this.y > this.startY) this.y -= 1;
  }
  draw(ctx) {
    const cx = this.x, cy = this.y;
    ctx.save();
    const flash = this.flashTimer > 0 && time() - this.flashTimer < 80;
    ctx.fillStyle = flash ? "#fff" : "#b22";
    ctx.strokeStyle = flash ? "#fff" : "#f44";
    ctx.beginPath(); ctx.moveTo(cx, cy + 35);
    ctx.lineTo(cx - 36, cy - 30); ctx.lineTo(cx + 36, cy - 30);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? "#fff" : "#808";
    ctx.beginPath(); ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx - 44, cy + 26); ctx.lineTo(cx + 44, cy + 26);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.fillStyle = "#ff0"; ctx.beginPath(); ctx.arc(cx, cy - 12, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#f80"; ctx.beginPath(); ctx.arc(cx, cy - 12, 4, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}
// ===================== 爆炸特效 =====================
class Explosion {
  constructor(x, y, size = "medium") {
    this.x = x; this.y = y;
    this.maxR = size === "large" ? 40 : size === "small" ? 15 : 25;
    this.r = 2; this.life = 0; this.maxLife = 20;
    this.alive = true;
  }
  update() {
    this.life++; this.r += 3;
    if (this.life > this.maxLife) this.alive = false;
  }
  draw(ctx) {
    const alpha = Math.max(0, 1 - this.life / this.maxLife);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#fc2";
    ctx.lineWidth = Math.max(1, Math.floor(this.r / 3));
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffc";
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ===================== 道具 =====================
class PowerUp {
  constructor(x, y, type = "power") {
    this.x = x; this.y = y; this.type = type;
    this.r = 12; this.speed = 2; this.alive = true;
    this.colors = { power: "#f80", health: "#3c6", shield: "#0cf" };
    this.icons = { power: "P", health: "H", shield: "S" };
  }
  update() {
    this.y += this.speed;
    if (this.y > H + 20) this.alive = false;
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.colors[this.type] || "#fff";
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(this.icons[this.type] || "?", this.x, this.y);
    ctx.restore();
  }
}

// ===================== 时间辅助 =====================
let _now = 0;
function time() { return _now; }
function setTime(t) { _now = t; }

// ===================== 游戏主类 =====================
class Game {
  constructor() {
    this.state = "menu"; // menu, playing, paused, gameOver
    this.score = 0; this.highScore = parseInt(localStorage.getItem("planeBattleHS") || "0");
    this.level = 1; this.kills = 0; this.killsToNextLevel = 20;
    this.bossActive = false; this.bossDefeated = 0;

    this.starfield = new StarField();
    this.player = new Player();
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerups = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnDelay = 1500;
    this.notification = null;
    this.keys = {};
    this.lastFrame = 0;

    // Touch controls
    this.touchX = null; this.touchY = null; this.touchShoot = false;
    this._setupInput();
    this._initBGM();
  }

  _initBGM() {
    this.bgmNode = null; this.bgmGain = null; this.bgmPlaying = false;
  }

  _playBGM() {
    if (this.bgmPlaying) return;
    try {
      initAudio();
      if (!audioCtx) return;
      // Simple looping bass drone as BGM
      const sr = audioCtx.sampleRate;
      const noteLen = sr * 2; // 2 second loop
      const totalLen = sr * 16; // 16 seconds
      const buf = audioCtx.createBuffer(1, totalLen, sr);
      const data = buf.getChannelData(0);
      // Simple beat pattern
      for (let i = 0; i < totalLen; i++) {
        const t = i / sr;
        // Bass line
        const bassFreqs = [130.81, 146.83, 164.81, 174.61, 196.00, 174.61, 164.81, 146.83];
        const bassIdx = Math.floor(t * 2) % bassFreqs.length;
        const freq = bassFreqs[bassIdx];
        let v = Math.sin(2 * Math.PI * freq * t) * 0.3;
        // Add rhythm
        const beat = Math.floor(t * 4) % 4;
        if (beat === 0) v += Math.sin(2 * Math.PI * 440 * t) * 0.08 * Math.max(0, 1 - ((t * 4) % 1));
        data[i] = v;
      }
      const src = audioCtx.createBufferSource();
      src.loop = true;
      src.buffer = buf;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.12;
      src.connect(gain); gain.connect(audioCtx.destination);
      src.start();
      this.bgmSrc = src; this.bgmGain = gain; this.bgmPlaying = true;
    } catch (e) { /* silent */ }
  }

  _stopBGM() {
    if (this.bgmSrc) { try { this.bgmSrc.stop(); } catch(e){} this.bgmSrc = null; }
    this.bgmPlaying = false;
  }

  _pauseBGM() {
    if (this.bgmGain) { try { this.bgmGain.gain.value = 0; } catch(e){} }
  }

  _unpauseBGM() {
    if (this.bgmGain) { try { this.bgmGain.gain.value = 0.12; } catch(e){} }
  }
  _setupInput() {
    document.addEventListener("keydown", e => { this.keys[e.code] = true; if (["Space","ArrowUp","ArrowDown"].includes(e.code)) e.preventDefault(); });
    document.addEventListener("keyup", e => { this.keys[e.code] = false; });
    // Touch controls for mobile
    canvas.addEventListener("touchstart", e => {
      e.preventDefault(); const t = e.touches[0]; const r = canvas.getBoundingClientRect();
      this.touchX = t.clientX - r.left; this.touchY = t.clientY - r.top; this.touchShoot = true;
      initAudio();
    }, { passive: false });
    canvas.addEventListener("touchmove", e => {
      e.preventDefault(); const t = e.touches[0]; const r = canvas.getBoundingClientRect();
      this.touchX = t.clientX - r.left; this.touchY = t.clientY - r.top;
    }, { passive: false });
    canvas.addEventListener("touchend", e => { e.preventDefault(); this.touchShoot = false; }, { passive: false });
    canvas.addEventListener("click", () => initAudio());
  }

  _notify(text) {
    this.notification = { text, timer: performance.now(), duration: 2000 };
  }

  spawnEnemy(time) {
    if (time - this.enemySpawnTimer < this.enemySpawnDelay) return;
    this.enemySpawnTimer = time;
    this.enemySpawnDelay = Math.max(400, 1500 - this.level * 100);

    // Boss check
    if (!this.bossActive && (this.bossDefeated === 0 || this.kills >= (this.bossDefeated + 1) * 30)) {
      const boss = new EnemyBoss(W / 2, -80, this.bossDefeated + 1);
      this.enemies.push(boss);
      this.bossActive = true;
      this._notify(`Boss来袭! 第${this.bossDefeated + 1}关`);
      return;
    }

    const x = 30 + Math.random() * (W - 60);
    const r = Math.random();
    let e;
    if (r < 0.5) e = new EnemyBasic(x, -30);
    else if (r < 0.8) e = this.level >= 2 ? new EnemyFast(x, -30) : new EnemyBasic(x, -30);
    else e = this.level >= 3 ? new EnemyTank(x, -30) : new EnemyBasic(x, -30);
    this.enemies.push(e);
  }

  enemyShoot(enemy, time) {
    if (enemy.shouldShoot(time)) {
      this.enemyBullets.push(new Bullet(enemy.x, enemy.y + enemy.h / 2 + 5, 5, true, 10));
    }
  }

  playerShoot() {
    SFX.shoot();
    const dmg = 10 + this.player.power * 2;
    for (const [x, y] of this.player.getShootPos()) {
      this.bullets.push(new Bullet(x, y, -14, false, dmg));
    }
  }

  spawnPowerup(x, y) {
    const types = ["power","power","health","health","shield"];
    const t = types[Math.floor(Math.random() * types.length)];
    this.powerups.push(new PowerUp(x, y, t));
  }

  explode(x, y, size = "medium") {
    this.explosions.push(new Explosion(x, y, size));
  }

  reset() {
    this.score = 0; this.level = 1; this.kills = 0;
    this.bossActive = false; this.bossDefeated = 0; this.notification = null;
    this.bullets = []; this.enemyBullets = []; this.enemies = [];
    this.explosions = []; this.powerups = [];
    this.player.reset();
  }

  handleCollisions() {
    // Player bullets vs enemies
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!b.alive) continue;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (!e.alive) continue;
        if (Math.abs(b.x - e.x) < (b.w + e.w) / 2 - 4 && Math.abs(b.y - e.y) < (b.h + e.h) / 2 - 4) {
          b.alive = false;
          if (e.takeDamage(b.damage)) {
            this.score += e.score; this.kills++;
            SFX.explode();
            const sz = e instanceof EnemyBoss ? "large" : "medium";
            this.explode(e.x, e.y, sz);
            if (e instanceof EnemyBoss) {
              this.bossActive = false; this.bossDefeated++;
              this._notify(`Boss击败! +${e.score}分`);
              for (let k = 0; k < 3; k++) {
                this.spawnPowerup(e.x + (Math.random() - 0.5) * 80, e.y + (Math.random() - 0.5) * 40);
              }
            } else {
              if (Math.random() < 0.08) this.spawnPowerup(e.x, e.y);
            }
            e.alive = false;
          } else {
            this.explode(b.x, b.y, "small");
          }
          break;
        }
      }
    }

    // Enemy bullets vs player
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      if (!b.alive) continue;
      if (Math.abs(b.x - this.player.x) < (b.w + this.player.w) / 2 - 4 && Math.abs(b.y - this.player.y) < (b.h + this.player.h) / 2 - 4) {
        b.alive = false;
        if (this.player.takeDamage(b.damage)) {
          SFX.hit();
          this.explode(this.player.x, this.player.y, "medium");
        }
      }
    }

    // Enemies vs player (collision)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) continue;
      if (Math.abs(e.x - this.player.x) < (e.w + this.player.w) / 2 - 6 && Math.abs(e.y - this.player.y) < (e.h + this.player.h) / 2 - 6) {
        this.explode(e.x, e.y, "medium");
        const dmg = e instanceof EnemyBoss ? 40 : 20;
        if (this.player.takeDamage(dmg)) SFX.hit();
        e.alive = false;
      }
    }

    // Powerups vs player
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      if (!pu.alive) continue;
      if (Math.abs(pu.x - this.player.x) < pu.r + this.player.w / 2 - 4 && Math.abs(pu.y - this.player.y) < pu.r + this.player.h / 2 - 4) {
        if (pu.type === "power") this.player.powerUp();
        else if (pu.type === "health") this.player.heal(30);
        else if (pu.type === "shield") this.player.heal(50);
        SFX.powerup(); pu.alive = false;
      }
    }

    // Cleanup dead objects
    this.bullets = this.bullets.filter(b => b.alive);
    this.enemyBullets = this.enemyBullets.filter(b => b.alive);
    this.enemies = this.enemies.filter(e => e.alive);
    this.explosions = this.explosions.filter(e => e.alive);
    this.powerups = this.powerups.filter(p => p.alive);
  }

  checkLevelUp() {
    if (this.kills >= this.killsToNextLevel) {
      this.level++; this.kills = 0;
      this.killsToNextLevel = 20 + this.level * 5;
      this._notify(`第${this.level}波!`);
      this.player.heal(20);
    }
  }

  drawMenu(ctx) {
    ctx.fillStyle = "#1e1e28"; ctx.fillRect(0, 0, W, H);
    this.starfield.draw(ctx);
    ctx.fillStyle = "#3cf"; ctx.font = "bold 56px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("飞 机 大 战", W / 2, 150);
    ctx.fillStyle = "#fe0"; ctx.font = "22px sans-serif";
    ctx.fillText("AIRCRAFT BATTLE", W / 2, 195);
    ctx.fillStyle = "#888"; ctx.font = "16px sans-serif";
    const controls = ["↑ ↓ → ← / WASD  移动", "SPACE  射击", "ESC  暂停"];
    controls.forEach((t, i) => ctx.fillText(t, W / 2, 270 + i * 30));
    if (this.highScore > 0) {
      ctx.fillStyle = "#fe0"; ctx.font = "20px sans-serif";
      ctx.fillText(`最高分: ${this.highScore}`, W / 2, 390);
    }
    if (Math.floor(performance.now() / 500) % 2 === 0) {
      ctx.fillStyle = "#fff"; ctx.font = "22px sans-serif";
      ctx.fillText("按 SPACE 或 ENTER 开始游戏", W / 2, 480);
    }
    ctx.fillStyle = "#444"; ctx.font = "12px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("v2.0 web by Codex  |  ♪ 背景音乐", 10, H - 15);
  }

  drawGameOver(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f44"; ctx.font = "bold 52px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("游 戏 结 束", W / 2, 200);
    ctx.fillStyle = "#fff"; ctx.font = "28px sans-serif";
    ctx.fillText(`最终得分: ${this.score}`, W / 2, 290);
    if (this.score >= this.highScore && this.score > 0) {
      ctx.fillStyle = "#fe0"; ctx.font = "32px sans-serif";
      ctx.fillText("新纪录! 🎉", W / 2, 340);
    }
    ctx.fillStyle = "#fe0"; ctx.font = "22px sans-serif";
    ctx.fillText(`最高分: ${this.highScore}`, W / 2, 390);
    ctx.fillStyle = "#888"; ctx.font = "18px sans-serif";
    ctx.fillText("按 SPACE 重新开始 | ESC 返回菜单", W / 2, 470);
  }
  // ===================== 主游戏循环 =====================
  run() {
    const loop = (timestamp) => {
      setTime(performance.now());
      ctx.clearRect(0, 0, W, H);

      if (this.state === "menu") {
        this.starfield.update();
        this.drawMenu(ctx);
        this._checkMenuInput();
      } else if (this.state === "playing") {
        this._updatePlaying(timestamp);
        this._drawPlaying(ctx);
      } else if (this.state === "paused") {
        this._drawPlaying(ctx);
        this._drawPause(ctx);
      } else if (this.state === "gameOver") {
        this.starfield.update();
        this._drawPlaying(ctx);
        this.drawGameOver(ctx);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _checkMenuInput() {
    if (this.keys["Space"] || this.keys["Enter"]) {
      initAudio(); this.reset(); this.state = "playing";
      this._playBGM(); this.enemySpawnTimer = performance.now();
      this.keys["Space"] = false; this.keys["Enter"] = false;
    }
  }

  _updatePlaying(timestamp) {
    const t = performance.now();
    this.starfield.update();
    const shouldShoot = this.player.update(this.keys, t);

    // Touch control
    if (this.touchX !== null) {
      const dx = this.touchX - this.player.x;
      const dy = this.touchY - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        this.player.x += (dx / dist) * this.player.speed;
        this.player.y += (dy / dist) * this.player.speed;
        this.player.x = Math.max(this.player.w / 2, Math.min(W - this.player.w / 2, this.player.x));
        this.player.y = Math.max(this.player.h / 2, Math.min(H - this.player.h / 2, this.player.y));
      }
      if (this.touchShoot && t - this.player.lastShot > this.player.shootDelay) {
        this.player.lastShot = t; this.playerShoot();
      }
    }
    if (shouldShoot) this.playerShoot();

    this.spawnEnemy(t);
    for (const e of this.enemies) { e.update(t); this.enemyShoot(e, t); }
    this.bullets.forEach(b => b.update());
    this.enemyBullets.forEach(b => b.update());
    this.explosions.forEach(e => e.update());
    this.powerups.forEach(p => p.update());

    this.handleCollisions();
    this.checkLevelUp();
    this._checkGameOver();
  }

  _drawPlaying(ctx) {
    ctx.fillStyle = "#1e1e28"; ctx.fillRect(0, 0, W, H);
    this.starfield.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);
    for (const p of this.powerups) p.draw(ctx);
    for (const ex of this.explosions) ex.draw(ctx);
    this.player.draw(ctx);
    this.player.drawHUD(ctx);

    ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`分数: ${this.score}`, 10, 20);
    ctx.fillStyle = "#3cf"; ctx.fillText(`等级: ${this.level}`, 10, 44);
    ctx.fillStyle = "#888"; ctx.fillText(`击杀: ${this.kills}/${this.killsToNextLevel}`, 10, 64);
    ctx.fillStyle = "#f80";
    ctx.fillText(`火力: ${"\u2605".repeat(this.player.power)}`, 10, 84);

    if (this.notification) {
      const elapsed = performance.now() - this.notification.timer;
      if (elapsed < this.notification.duration) {
        ctx.fillStyle = "#fe0"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(this.notification.text, W / 2, H / 3);
      } else {
        this.notification = null;
      }
    }
  }

  _drawPause(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.font = "bold 48px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("游 戏 暂 停", W / 2, H / 2 - 20);
    ctx.fillStyle = "#888"; ctx.font = "20px sans-serif";
    ctx.fillText("按 ESC 继续", W / 2, H / 2 + 30);
  }

  _checkGameOver() {
    if (this.player.hp <= 0) {
      SFX.gameOver();
      this.explode(this.player.x, this.player.y, "large");
      this._stopBGM();
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem("planeBattleHS", String(this.highScore));
      }
      this.state = "gameOver";
    }
  }
}

// ===================== 启动游戏 =====================
const game = new Game();

// Handle keyboard for menu/gameover
document.addEventListener("keydown", e => {
  if (game.state === "gameOver") {
    if (e.code === "Space") {
      e.preventDefault();
      game.reset(); game.state = "playing";
      game._playBGM(); game.enemySpawnTimer = performance.now();
    } else if (e.code === "Escape") {
      game.state = "menu"; game._stopBGM();
    }
  } else if (game.state === "playing" && e.code === "Escape") {
    game._pauseBGM(); game.state = "paused";
  } else if (game.state === "paused" && e.code === "Escape") {
    game._unpauseBGM(); game.state = "playing";
  }
});

game.run();
console.log("飞机大战已启动!");
