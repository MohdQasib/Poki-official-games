/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuteState() {
    return this.isMuted;
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, gainVals: number[], times: number[]) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(gainVals[0], this.ctx.currentTime);
    for (let i = 1; i < gainVals.length; i++) {
      gainNode.gain.exponentialRampToValueAtTime(gainVals[i], this.ctx.currentTime + times[i] * duration);
    }

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playCoin() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      
      const t1 = 0.05;
      const t2 = 0.15;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + t1); // E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(493.88, now); // B4
      osc2.frequency.setValueAtTime(659.25, now + t1); // E5

      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + t1 + t2);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + t1 + t2);
      osc2.stop(now + t1 + t2);
    } catch (e) {
      console.warn("Audio Context blocked or failed to initialize", e);
    }
  }

  public playClick() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
      
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  public playWin() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx?.createOscillator();
        const gainNode = this.ctx?.createGain();
        if (!osc || !gainNode) return;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gainNode.gain.setValueAtTime(0.06, now + idx * 0.07);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);

        osc.connect(gainNode);
        gainNode.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.18);
      });
    } catch (e) {}
  }

  public playSpin() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(70, now + 0.02);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  public playJump() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const dur = 0.25;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + dur);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + dur);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {}
  }

  public playSlide() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const dur = 0.3;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + dur);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + dur);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {}
  }

  public playCrash() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const dur = 0.6;

      // Lower frequency wave for boom
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + dur);

      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + dur);

      // Simple white noise imitation using triangle sweep
      const noise = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      noise.type = 'triangle';
      noise.frequency.setValueAtTime(100, now);
      noise.frequency.linearRampToValueAtTime(2000, now + 0.1);
      noise.frequency.linearRampToValueAtTime(80, now + dur);

      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
      noise.start(now);
      noise.stop(now + dur);
    } catch (e) {}
  }

  public playLevelUp() {
    try {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx?.createOscillator();
        const gainNode = this.ctx?.createGain();
        if (!osc || !gainNode) return;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gainNode.gain.setValueAtTime(0.1, now + idx * 0.1);
        gainNode.gain.setValueAtTime(0.1, now + idx * 0.1 + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

        osc.connect(gainNode);
        gainNode.connect(this.ctx!.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch (e) {}
  }
}

export const synth = new AudioSynth();
