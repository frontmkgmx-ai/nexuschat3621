class SoundService {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && !this.audioCtx) {
       this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private resume() {
     if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
     }
  }

  public setEnabled(enabled: boolean) {
     this.enabled = enabled;
  }

  // Play a simple synthesized tone
  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, sweepFreq?: number) {
     if (!this.enabled || !this.audioCtx) return;
     this.resume();

     const t = this.audioCtx.currentTime;
     const osc = this.audioCtx.createOscillator();
     const gain = this.audioCtx.createGain();

     osc.type = type;
     
     // Frequency envelope
     osc.frequency.setValueAtTime(freq, t);
     if (sweepFreq) {
         osc.frequency.exponentialRampToValueAtTime(sweepFreq, t + duration);
     }

     // Amplitude envelope
     gain.gain.setValueAtTime(0, t);
     gain.gain.linearRampToValueAtTime(vol, t + 0.05);
     gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

     osc.connect(gain);
     gain.connect(this.audioCtx.destination);

     osc.start(t);
     osc.stop(t + duration);
  }

  public playSend() {
      // Small pop
      this.playTone(300, 'sine', 0.1, 0.05, 500);
      setTimeout(() => this.playTone(500, 'sine', 0.15, 0.05, 800), 50);
  }

  public playReceive() {
      // Friendly pop-in
      this.playTone(600, 'sine', 0.1, 0.05, 800);
      setTimeout(() => this.playTone(800, 'sine', 0.2, 0.05, 1200), 80);
  }

  public playDelete() {
      // Negative / dropping sound
      this.playTone(200, 'triangle', 0.2, 0.1, 100);
  }

  public playReply() {
      // High quick ping
      this.playTone(1200, 'sine', 0.15, 0.05, 1500);
  }

  public playCallEnter() {
      // Ascending
      this.playTone(400, 'sine', 0.2, 0.05);
      setTimeout(() => this.playTone(600, 'sine', 0.2, 0.05), 100);
      setTimeout(() => this.playTone(800, 'sine', 0.3, 0.05), 200);
  }

  public playCallLeave() {
      // Descending
      this.playTone(800, 'sine', 0.2, 0.05);
      setTimeout(() => this.playTone(600, 'sine', 0.2, 0.05), 100);
      setTimeout(() => this.playTone(400, 'sine', 0.3, 0.05), 200);
  }

  public playCallMute() {
      // Small tick
      this.playTone(300, 'square', 0.05, 0.02, 100);
  }
}

export const soundService = new SoundService();
