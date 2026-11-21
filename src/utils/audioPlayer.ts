// Lightweight Web Audio API preview player so every audio clip plays cleanly offline & online

let activeCtx: AudioContext | null = null;
let stopTimer: number | null = null;
let currentTrackId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribeAudioState(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getPlayingAudioId(): string | null {
  return currentTrackId;
}

export function stopAudioPreview() {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeCtx) {
    try {
      activeCtx.close();
    } catch {
      // ignore
    }
    activeCtx = null;
  }
  currentTrackId = null;
  notify();
}

const MOOD_SCALES: Record<string, number[]> = {
  'Background Music': [261.63, 329.63, 392.0, 493.88, 392.0, 329.63],
  'Nature Sound': [329.63, 440.0, 523.25, 659.25, 587.33, 440.0],
  Notification: [587.33, 880.0, 1174.66],
  Happy: [392.0, 493.88, 587.33, 783.99, 659.25, 783.99],
  Sad: [220.0, 261.63, 311.13, 293.66, 220.0],
  Motivational: [293.66, 369.99, 440.0, 587.33, 659.25, 880.0],
};

export function toggleAudioPreview(trackId: string, mood = 'Background Music') {
  if (currentTrackId === trackId) {
    stopAudioPreview();
    return;
  }

  stopAudioPreview();

  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    activeCtx = ctx;
    currentTrackId = trackId;
    notify();

    const notes = MOOD_SCALES[mood] || MOOD_SCALES['Background Music'];
    const noteGap = mood === 'Notification' ? 0.14 : mood === 'Sad' ? 0.45 : 0.28;
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = mood === 'Motivational' ? 'triangle' : mood === 'Notification' ? 'sine' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * noteGap);

      gain.gain.setValueAtTime(0.001, now + idx * noteGap);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * noteGap + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteGap + noteGap * 0.95);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * noteGap);
      osc.stop(now + idx * noteGap + noteGap);
    });

    const totalMs = Math.round(notes.length * noteGap * 1000 + 150);
    stopTimer = window.setTimeout(() => {
      if (currentTrackId === trackId) {
        stopAudioPreview();
      }
    }, totalMs);
  } catch {
    currentTrackId = null;
    notify();
  }
}
