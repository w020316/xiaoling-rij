"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";

interface Track {
  id: string;
  name: string;
  emoji: string;
}

const tracks: Track[] = [
  { id: "morning-birds", name: "清晨鸟鸣", emoji: "🐦" },
  { id: "stream", name: "溪流声", emoji: "💧" },
  { id: "rain", name: "雨声", emoji: "🌧️" },
  { id: "ocean", name: "海浪", emoji: "🌊" },
  { id: "starry-piano", name: "星空钢琴", emoji: "⭐" },
  { id: "healing-guitar", name: "治愈吉他", emoji: "🎸" },
  { id: "forest-walk", name: "森林漫步", emoji: "🌲" },
  { id: "coffee-time", name: "咖啡时光", emoji: "☕" },
];

const STORAGE_KEY_TRACK = "music-player-track";
const STORAGE_KEY_VOLUME = "music-player-volume";

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 4;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 4;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3;
  }
  return buffer;
}

function createNoiseSource(ctx: AudioContext, buffer: AudioBuffer, destination: AudioNode): { source: AudioBufferSourceNode; gain: GainNode } {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  source.connect(gain);
  gain.connect(destination);

  return { source, gain };
}

function scheduleNotes(
  ctx: AudioContext,
  output: AudioNode,
  frequencies: number[],
  intervalMs: number,
  waveform: OscillatorType,
  noteDuration: number,
  baseVolume: number,
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let index = 0;
  let stopped = false;

  function playNext() {
    if (stopped || ctx.state === "closed") return;

    const freq = frequencies[index % frequencies.length];
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    noteGain.gain.setValueAtTime(0, ctx.currentTime);
    noteGain.gain.linearRampToValueAtTime(baseVolume, ctx.currentTime + 0.08);
    noteGain.gain.setValueAtTime(baseVolume * 0.7, ctx.currentTime + noteDuration * 0.5);
    noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + noteDuration);

    osc.connect(noteGain);
    noteGain.connect(output);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + noteDuration + 0.1);

    index++;
    timeoutId = setTimeout(playNext, intervalMs);
  }

  playNext();

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}

function startMorningBirds(ctx: AudioContext, output: AudioNode): () => void {
  const cleanupFns: (() => void)[] = [];

  const windBuffer = createNoiseBuffer(ctx);
  const { source: windSource, gain: windGain } = createNoiseSource(ctx, windBuffer, output);
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "lowpass";
  windFilter.frequency.value = 400;
  windFilter.Q.value = 0.5;
  windSource.disconnect();
  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.gain.value = 0.06;
  windSource.start();
  cleanupFns.push(() => {
    try { windSource.stop(); } catch { /* ignore */ }
    windGain.disconnect();
  });

  function createChirp(delay: number) {
    const timeoutId = setTimeout(() => {
      const osc = ctx.createOscillator();
      const chirpGain = ctx.createGain();
      osc.type = "sine";
      const baseFreq = 2000 + Math.random() * 3500;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.06);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, ctx.currentTime + 0.12);

      chirpGain.gain.setValueAtTime(0, ctx.currentTime);
      chirpGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      chirpGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

      osc.connect(chirpGain);
      chirpGain.connect(output);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);

      const nextDelay = 800 + Math.random() * 3000;
      createChirp(nextDelay);
    }, delay);

    cleanupFns.push(() => clearTimeout(timeoutId));
  }

  for (let i = 0; i < 4; i++) {
    createChirp(Math.random() * 2000);
  }

  return () => cleanupFns.forEach((fn) => fn());
}

function startStream(ctx: AudioContext, output: AudioNode): () => void {
  const buffer = createNoiseBuffer(ctx);
  const { source, gain } = createNoiseSource(ctx, buffer, output);

  const filters: BiquadFilterNode[] = [];
  const centerFreqs = [400, 900, 1600, 2800];

  for (const freq of centerFreqs) {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = 0.6;
    bp.connect(gain);
    filters.push(bp);
  }

  source.connect(filters[0]);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 100;
  lfo.connect(lfoGain);
  lfoGain.connect(filters[0].frequency);
  lfo.start();

  gain.gain.value = 0.08;
  source.start();

  return () => {
    try { source.stop(); } catch { /* ignore */ }
    try { lfo.stop(); } catch { /* ignore */ }
    gain.disconnect();
    lfoGain.disconnect();
    filters.forEach((f) => f.disconnect());
  };
}

function startRain(ctx: AudioContext, output: AudioNode): () => void {
  const buffer = createNoiseBuffer(ctx);
  const { source: src1, gain: gain1 } = createNoiseSource(ctx, buffer, output);
  const lp1 = ctx.createBiquadFilter();
  lp1.type = "lowpass";
  lp1.frequency.value = 600;
  src1.disconnect();
  src1.connect(lp1);
  lp1.connect(gain1);
  gain1.gain.value = 0.1;
  src1.start();

  const buffer2 = createNoiseBuffer(ctx);
  const { source: src2, gain: gain2 } = createNoiseSource(ctx, buffer2, output);
  const bp2 = ctx.createBiquadFilter();
  bp2.type = "bandpass";
  bp2.frequency.value = 2000;
  bp2.Q.value = 0.3;
  src2.disconnect();
  src2.connect(bp2);
  bp2.connect(gain2);
  gain2.gain.value = 0.04;
  src2.start();

  return () => {
    try { src1.stop(); } catch { /* ignore */ }
    try { src2.stop(); } catch { /* ignore */ }
    gain1.disconnect();
    gain2.disconnect();
  };
}

function startOcean(ctx: AudioContext, output: AudioNode): () => void {
  const buffer = createBrownNoiseBuffer(ctx);
  const { source, gain } = createNoiseSource(ctx, buffer, output);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 180;
  source.disconnect();
  source.connect(lp);
  lp.connect(gain);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  gain.gain.value = 0.06;
  lfo.start();

  const foamBuffer = createNoiseBuffer(ctx);
  const { source: foamSrc, gain: foamGain } = createNoiseSource(ctx, foamBuffer, output);
  const foamFilter = ctx.createBiquadFilter();
  foamFilter.type = "highpass";
  foamFilter.frequency.value = 2000;
  foamSrc.disconnect();
  foamSrc.connect(foamFilter);
  foamFilter.connect(foamGain);
  foamGain.gain.value = 0.015;
  foamSrc.start();

  source.start();

  return () => {
    try { source.stop(); } catch { /* ignore */ }
    try { foamSrc.stop(); } catch { /* ignore */ }
    try { lfo.stop(); } catch { /* ignore */ }
    gain.disconnect();
    foamGain.disconnect();
    lfoGain.disconnect();
  };
}

function startStarryPiano(ctx: AudioContext, output: AudioNode): () => void {
  const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  return scheduleNotes(ctx, output, pentatonic, 1200, "sine", 2.0, 0.1);
}

function startHealingGuitar(ctx: AudioContext, output: AudioNode): () => void {
  const notes = [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 293.66, 261.63, 220.00, 196.00];
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.15;
  delay.connect(output);

  const fbGain = ctx.createGain();
  fbGain.gain.value = 0.2;
  delay.connect(fbGain);
  fbGain.connect(delay);

  const stopNotes = scheduleNotes(ctx, delay, notes, 900, "triangle", 1.6, 0.1);

  return () => {
    stopNotes();
    delay.disconnect();
    fbGain.disconnect();
  };
}

function startForestWalk(ctx: AudioContext, output: AudioNode): () => void {
  const cleanupFns: (() => void)[] = [];

  const windBuffer = createNoiseBuffer(ctx);
  const { source: windSrc, gain: windGain } = createNoiseSource(ctx, windBuffer, output);
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "lowpass";
  windFilter.frequency.value = 300;
  windSrc.disconnect();
  windSrc.connect(windFilter);
  windFilter.connect(windGain);
  windGain.gain.value = 0.05;
  windSrc.start();
  cleanupFns.push(() => {
    try { windSrc.stop(); } catch { /* ignore */ }
    windGain.disconnect();
  });

  function createBirdCall(delay: number) {
    const timeoutId = setTimeout(() => {
      const osc = ctx.createOscillator();
      const chirpGain = ctx.createGain();
      osc.type = "sine";
      const baseFreq = 1800 + Math.random() * 2500;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.4, ctx.currentTime + 0.05);

      chirpGain.gain.setValueAtTime(0, ctx.currentTime);
      chirpGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      chirpGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

      osc.connect(chirpGain);
      chirpGain.connect(output);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);

      const nextDelay = 3000 + Math.random() * 7000;
      createBirdCall(nextDelay);
    }, delay);

    cleanupFns.push(() => clearTimeout(timeoutId));
  }

  createBirdCall(1500 + Math.random() * 3000);

  return () => cleanupFns.forEach((fn) => fn());
}

function startCoffeeTime(ctx: AudioContext, output: AudioNode): () => void {
  const cleanupFns: (() => void)[] = [];

  const frequencies = [130.81, 164.81, 196.00, 220.00, 261.63];

  for (const freq of frequencies) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.05 + Math.random() * 0.1;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    oscGain.gain.value = 0.04;
    osc.connect(oscGain);
    oscGain.connect(output);

    osc.start();
    lfo.start();

    cleanupFns.push(() => {
      try { osc.stop(); } catch { /* ignore */ }
      try { lfo.stop(); } catch { /* ignore */ }
      oscGain.disconnect();
      lfoGain.disconnect();
    });
  }

  const noiseBuffer = createNoiseBuffer(ctx);
  const { source: noiseSrc, gain: noiseGain } = createNoiseSource(ctx, noiseBuffer, output);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 200;
  noiseSrc.disconnect();
  noiseSrc.connect(lp);
  lp.connect(noiseGain);
  noiseGain.gain.value = 0.02;
  noiseSrc.start();
  cleanupFns.push(() => {
    try { noiseSrc.stop(); } catch { /* ignore */ }
    noiseGain.disconnect();
  });

  return () => cleanupFns.forEach((fn) => fn());
}

function startTrack(ctx: AudioContext, output: AudioNode, trackId: string): () => void {
  switch (trackId) {
    case "morning-birds":
      return startMorningBirds(ctx, output);
    case "stream":
      return startStream(ctx, output);
    case "rain":
      return startRain(ctx, output);
    case "ocean":
      return startOcean(ctx, output);
    case "starry-piano":
      return startStarryPiano(ctx, output);
    case "healing-guitar":
      return startHealingGuitar(ctx, output);
    case "forest-walk":
      return startForestWalk(ctx, output);
    case "coffee-time":
      return startCoffeeTime(ctx, output);
    default:
      return () => {};
  }
}

export default function MusicPlayer() {
  const [isSupported, setIsSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(STORAGE_KEY_TRACK);
    if (saved) {
      const idx = tracks.findIndex((t) => t.id === saved);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    return saved ? parseFloat(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const stopSoundRef = useRef<(() => void) | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      new AudioContext();
    } catch {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRACK, tracks[currentTrackIndex].id);
  }, [currentTrackIndex]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.getElementById("music-player-btn");
        if (btn && !btn.contains(e.target as Node)) {
          setIsPanelOpen(false);
        }
      }
    }
    if (isPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
        masterGainRef.current = audioCtxRef.current.createGain();
        masterGainRef.current.gain.value = isMuted ? 0 : volume;
        masterGainRef.current.connect(audioCtxRef.current.destination);
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      setIsSupported(false);
      return null;
    }
  }, [volume, isMuted]);

  const stopSound = useCallback(() => {
    if (stopSoundRef.current) {
      stopSoundRef.current();
      stopSoundRef.current = null;
    }
  }, []);

  const playTrack = useCallback(
    (trackId: string) => {
      stopSound();
      const ctx = getAudioContext();
      if (!ctx || !masterGainRef.current) return;

      const cleanup = startTrack(ctx, masterGainRef.current, trackId);
      stopSoundRef.current = cleanup;
      setIsPlaying(true);
    },
    [getAudioContext, stopSound],
  );

  const togglePlay = useCallback(() => {
    if (!isSupported) return;

    if (isPlaying) {
      stopSound();
      setIsPlaying(false);
    } else {
      playTrack(tracks[currentTrackIndex].id);
    }
  }, [isSupported, isPlaying, currentTrackIndex, playTrack, stopSound]);

  const prevTrack = useCallback(() => {
    const newIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(newIndex);
    if (isPlaying) {
      stopSound();
      setTimeout(() => {
        const ctx = getAudioContext();
        if (!ctx || !masterGainRef.current) return;
        const cleanup = startTrack(ctx, masterGainRef.current, tracks[newIndex].id);
        stopSoundRef.current = cleanup;
        setIsPlaying(true);
      }, 50);
    }
  }, [currentTrackIndex, isPlaying, getAudioContext, stopSound]);

  const nextTrack = useCallback(() => {
    const newIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(newIndex);
    if (isPlaying) {
      stopSound();
      setTimeout(() => {
        const ctx = getAudioContext();
        if (!ctx || !masterGainRef.current) return;
        const cleanup = startTrack(ctx, masterGainRef.current, tracks[newIndex].id);
        stopSoundRef.current = cleanup;
        setIsPlaying(true);
      }, 50);
    }
  }, [currentTrackIndex, isPlaying, getAudioContext, stopSound]);

  const selectTrack = useCallback(
    (index: number) => {
      if (index === currentTrackIndex && isPlaying) {
        togglePlay();
        return;
      }
      setCurrentTrackIndex(index);
      stopSound();
      setTimeout(() => {
        const ctx = getAudioContext();
        if (!ctx || !masterGainRef.current) return;
        const cleanup = startTrack(ctx, masterGainRef.current, tracks[index].id);
        stopSoundRef.current = cleanup;
        setIsPlaying(true);
      }, 50);
    },
    [currentTrackIndex, isPlaying, getAudioContext, stopSound, togglePlay],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const currentTrack = tracks[currentTrackIndex];

  if (!isSupported) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <div className="glass-card px-3 py-2 text-xs text-muted-foreground">
          浏览器不支持音频播放
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        id="music-player-btn"
        onClick={() => {
          if (!isPanelOpen) {
            setIsPanelOpen(true);
            if (!audioCtxRef.current) {
              getAudioContext();
            }
          } else {
            setIsPanelOpen(false);
          }
        }}
        className={`fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full glass-card flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg ${
          isPlaying ? "breathe-border text-primary" : "text-muted-foreground"
        }`}
        aria-label="背景音乐"
      >
        <Music size={20} className={isPlaying ? "sparkle" : ""} />
      </button>

      {isPanelOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-[7rem] right-4 z-50 w-72 glass-card p-4 slide-up max-h-[60vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold gradient-text flex items-center gap-1.5">
              <Music size={14} />
              治愈音乐
            </h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">{currentTrack.emoji}</span>
            <span className="text-sm font-medium text-foreground">{currentTrack.name}</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={prevTrack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3 px-1">
            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0 && isMuted) setIsMuted(false);
                if (v === 0 && !isMuted) setIsMuted(true);
              }}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--primary) ${(isMuted ? 0 : volume) * 100}%, var(--muted) ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 -mx-1">
            {tracks.map((track, index) => {
              const isActive = index === currentTrackIndex;
              return (
                <button
                  key={track.id}
                  onClick={() => selectTrack(index)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{track.emoji}</span>
                  <span>{track.name}</span>
                  {isActive && isPlaying && (
                    <span className="ml-auto flex gap-0.5 items-end h-3">
                      <span className="w-0.5 bg-primary rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0s" }} />
                      <span className="w-0.5 bg-primary rounded-full animate-pulse" style={{ height: "100%", animationDelay: "0.2s" }} />
                      <span className="w-0.5 bg-primary rounded-full animate-pulse" style={{ height: "40%", animationDelay: "0.4s" }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}