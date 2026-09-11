class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound(enabled) {
    this.enabled = enabled;
  }

  // Realistic Referee Whistle (Dual-frequency with LFO trill)
  playWhistle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    lfo.frequency.setValueAtTime(30, now);
    lfoGain.gain.setValueAtTime(50, now);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(2700, now);
    osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
    osc1.frequency.setValueAtTime(2900, now + 0.22);
    osc1.frequency.exponentialRampToValueAtTime(3400, now + 0.45);

    osc2.frequency.setValueAtTime(2735, now);
    osc2.frequency.exponentialRampToValueAtTime(3235, now + 0.12);
    osc2.frequency.setValueAtTime(2935, now + 0.22);
    osc2.frequency.exponentialRampToValueAtTime(3435, now + 0.45);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain.gain.setValueAtTime(0.24, now + 0.2);
    gain.gain.setValueAtTime(0.32, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    lfo.stop(now + 0.55);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  }

  // Double Referee Whistle Blast (Match Kickoff / Selection Complete)
  playDoubleWhistle() {
    if (!this.enabled) return;
    this.playWhistle();
    setTimeout(() => {
      this.playWhistle();
    }, 280);
  }

  // Metallic 3D Coin Spin and Ping
  playCoinToss() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 14; i++) {
      const clickTime = now + i * 0.16 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2100 + i * 90 + Math.random() * 200, clickTime);
      gain.gain.setValueAtTime(0.14, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }

    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1760, now);
    chime.frequency.exponentialRampToValueAtTime(3520, now + 0.1);
    chime.frequency.exponentialRampToValueAtTime(2637, now + 0.4);
    chimeGain.gain.setValueAtTime(0.28, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now);
    chime.stop(now + 0.65);
  }

  // Football Strike / Ball Kick (Deep punchy impact on turf)
  playBallKick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Transfer Signing Pop & Arpeggio (When a captain picks a player)
  playPick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.playBallKick();

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.04 + idx * 0.04);
      gain.gain.setValueAtTime(0.22, now + 0.04 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.04 + idx * 0.04);
      osc.stop(now + 0.35 + idx * 0.04);
    });
  }

  // Goalkeeper Glove Catch / Save Clap Sound
  playGkAutoAssign() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, now + 0.08 + idx * 0.07);
      chimeGain.gain.setValueAtTime(0.24, now + 0.08 + idx * 0.07);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.07);
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start(now + 0.08 + idx * 0.07);
      chime.stop(now + 0.45 + idx * 0.07);
    });
  }

  // Tension Heartbeat / Clock Tick (<10s)
  playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Time-out Buzzer
  playBuzzer() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Stadium Crowd Roar / Fanfare Celebration (Draft Complete)
  playCheer() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.playDoubleWhistle();

    const fanfareNotes = [
      { f: 523.25, t: 0.1, d: 0.2 },
      { f: 659.25, t: 0.28, d: 0.2 },
      { f: 783.99, t: 0.46, d: 0.24 },
      { f: 1046.5, t: 0.70, d: 0.85 },
      { f: 1318.5, t: 0.90, d: 0.95 }
    ];

    fanfareNotes.forEach(({ f, t, d }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.3, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }
}

export const sfx = new SoundEffects();