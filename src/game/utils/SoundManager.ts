export class SoundManager {
    private context: AudioContext;
    private masterGain: GainNode;

    constructor() {
        // Initialize AudioContext
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3; // Default volume
        this.masterGain.connect(this.context.destination);
    }

    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime + startTime);

        gain.gain.setValueAtTime(this.masterGain.gain.value, this.context.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(this.context.currentTime + startTime);
        osc.stop(this.context.currentTime + startTime + duration);
    }

    public playEat() {
        this.playTone(400, 'sine', 0.1);
    }

    public playPowerUp() {
        this.playTone(600, 'square', 0.1);
        this.playTone(800, 'square', 0.1, 0.1);
        this.playTone(1000, 'square', 0.2, 0.2);
    }

    public playDie() {
        this.playTone(300, 'sawtooth', 0.2);
        this.playTone(250, 'sawtooth', 0.2, 0.2);
        this.playTone(200, 'sawtooth', 0.4, 0.4);
    }

    public playWin() {
        this.playTone(400, 'sine', 0.1);
        this.playTone(500, 'sine', 0.1, 0.1);
        this.playTone(600, 'sine', 0.1, 0.2);
        this.playTone(800, 'sine', 0.4, 0.3);
    }
}
