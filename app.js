/**
 * FORMIQ — Master Choreography & Cinematic Spatial Audio Engine
 * "Every response has a story."
 * Cinema-Grade Procedural Web Audio Engine:
 * - Multi-oscillator subharmonic drone pad with dynamic filter modulation
 * - Algorithmic spatial reverb & stereo dynamics compressor
 * - Sub-bass cinematic boom impacts, Doppler whooshes, crystal singing bowl
 * - Real-time FFT audio visualizer in the HUD
 * - Scene lifecycle soundscapes & tactile acoustic micro-interactions
 */

(function () {
  'use strict';

  // Scene Definitions
  const SCENE_NAMES = [
    'THE VOID',
    'THE CHAOS',
    'FORM',
    'COLLECT',
    'INTELLIGENCE',
    'INSIGHT',
    'DECISION',
    'PIPELINE',
    'MULTIPLE WORLDS',
    'TECHNOLOGY',
    'TRANSFORMATION',
    'DECISION'
  ];

  const TOTAL_SCENES = 12;
  let activeSceneIndex = 1;

  // DOM Elements
  const container = document.getElementById('cinema-container');
  const sceneFrames = Array.from(document.querySelectorAll('.scene-frame'));
  const hud = document.getElementById('cinema-hud');
  const hudProgressBar = document.getElementById('hud-progress-bar');
  const hudSceneIndex = document.getElementById('hud-scene-index');
  const hudSceneName = document.getElementById('hud-scene-name');
  const scrollPrompt = document.getElementById('scroll-prompt');
  const audioToggle = document.getElementById('audio-toggle');
  const audioLabel = document.getElementById('audio-label');
  const fsToggle = document.getElementById('fs-toggle');

  // Audio Visualizer & Onboarding Pill
  const audioVisCanvas = document.getElementById('audio-visualizer-canvas');
  const audioPromptPill = document.getElementById('audio-prompt-pill');
  const pillEnableBtn = document.getElementById('pill-enable-btn');
  const pillDismissBtn = document.getElementById('pill-dismiss-btn');

  // =========================================================================
  // 1. CINEMA-GRADE PROCEDURAL WEB AUDIO SYNTHESIZER
  // =========================================================================
  let audioCtx = null;
  let masterGain = null;
  let masterCompressor = null;
  let masterFilter = null;
  let reverbNode = null;
  let analyserNode = null;
  let audioActive = false;

  // Drone Oscs & LFOs
  let droneOsc1 = null; // Sub Bass (55Hz Sine)
  let droneOsc2 = null; // Warmth (110Hz Triangle)
  let droneOsc3 = null; // Harmonic (165Hz Saw)
  let droneFilter = null;
  let droneGain = null;
  let dronePanner = null;
  let droneLfo = null;

  // Throttle tracker for mouse sparkles
  let lastSparkleTime = 0;

  function initAudioEngine() {
    if (audioCtx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();

      // Master Dynamics Compressor (IMAX peak limiter & glue)
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(12, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(4, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);

      // Master Biquad Low-Pass Filter
      masterFilter = audioCtx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(2400, audioCtx.currentTime);
      masterFilter.Q.setValueAtTime(1.0, audioCtx.currentTime);

      // Master Gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.65, audioCtx.currentTime);

      // FFT Analyser for Real-time HUD Visualizer
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      analyserNode.smoothingTimeConstant = 0.8;

      // Spatial Reverb Simulation (Feedback Delay Network)
      reverbNode = createSpatialReverbNetwork(audioCtx);

      // Signal Routing:
      // Sources -> MasterFilter -> MasterCompressor -> Analyser -> MasterGain -> Destination
      masterFilter.connect(masterCompressor);
      reverbNode.connect(masterCompressor);
      masterCompressor.connect(analyserNode);
      analyserNode.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      // Start the Visualizer Canvas Loop
      startVisualizerLoop();
    } catch (e) {
      console.warn('Audio Context initialization error:', e);
    }
  }

  // Algorithmic Spatial Reverb Network (No external impulse files needed!)
  function createSpatialReverbNetwork(ctx) {
    const input = ctx.createGain();
    const delay1 = ctx.createDelay();
    const delay2 = ctx.createDelay();
    const feedback = ctx.createGain();
    const dampFilter = ctx.createBiquadFilter();

    delay1.delayTime.value = 0.045; // 45ms early reflections
    delay2.delayTime.value = 0.085; // 85ms late tail
    feedback.gain.value = 0.42;

    dampFilter.type = 'lowpass';
    dampFilter.frequency.value = 1800; // Warm room absorption

    input.connect(delay1);
    delay1.connect(dampFilter);
    dampFilter.connect(delay2);
    delay2.connect(feedback);
    feedback.connect(delay1);

    const outGain = ctx.createGain();
    outGain.gain.value = 0.28;
    delay2.connect(outGain);

    input.input = input;
    input.output = outGain;
    return input;
  }

  // Subharmonic Drone Pad Generator
  function startSubharmonicDrone() {
    if (!audioCtx || droneOsc1) return;
    try {
      droneFilter = audioCtx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(320, audioCtx.currentTime);
      droneFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

      droneGain = audioCtx.createGain();
      droneGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      droneGain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 3.0);

      dronePanner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      // Voice 1: Deep Sub-Bass (55Hz Sine / A1)
      droneOsc1 = audioCtx.createOscillator();
      droneOsc1.type = 'sine';
      droneOsc1.frequency.setValueAtTime(55, audioCtx.currentTime);

      // Voice 2: Warm Body (110Hz Triangle) with LFO vibrato
      droneOsc2 = audioCtx.createOscillator();
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.setValueAtTime(110, audioCtx.currentTime);

      // Voice 3: Overtone (165Hz Filtered Sawtooth)
      droneOsc3 = audioCtx.createOscillator();
      droneOsc3.type = 'sawtooth';
      droneOsc3.frequency.setValueAtTime(164.81, audioCtx.currentTime);

      // Vibrato LFO on Voice 2
      droneLfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      droneLfo.frequency.setValueAtTime(0.18, audioCtx.currentTime); // Slow 0.18Hz swell
      lfoGain.gain.setValueAtTime(1.5, audioCtx.currentTime);
      droneLfo.connect(lfoGain);
      lfoGain.connect(droneOsc2.frequency);

      // Connect drone voices
      const voiceGain1 = audioCtx.createGain(); voiceGain1.gain.value = 0.6;
      const voiceGain2 = audioCtx.createGain(); voiceGain2.gain.value = 0.35;
      const voiceGain3 = audioCtx.createGain(); voiceGain3.gain.value = 0.15;

      droneOsc1.connect(voiceGain1); voiceGain1.connect(droneFilter);
      droneOsc2.connect(voiceGain2); voiceGain2.connect(droneFilter);
      droneOsc3.connect(voiceGain3); voiceGain3.connect(droneFilter);

      if (dronePanner) {
        droneFilter.connect(dronePanner);
        dronePanner.connect(droneGain);
      } else {
        droneFilter.connect(droneGain);
      }

      droneGain.connect(masterFilter);
      droneGain.connect(reverbNode); // Send to spatial reverb

      droneOsc1.start();
      droneOsc2.start();
      droneOsc3.start();
      droneLfo.start();
    } catch (e) {
      console.warn('Drone start error:', e);
    }
  }

  function stopSubharmonicDrone() {
    if (!droneOsc1) return;
    try {
      droneGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.0);
      setTimeout(() => {
        if (droneOsc1) { droneOsc1.stop(); droneOsc1.disconnect(); droneOsc1 = null; }
        if (droneOsc2) { droneOsc2.stop(); droneOsc2.disconnect(); droneOsc2 = null; }
        if (droneOsc3) { droneOsc3.stop(); droneOsc3.disconnect(); droneOsc3 = null; }
        if (droneLfo) { droneLfo.stop(); droneLfo.disconnect(); droneLfo = null; }
      }, 1100);
    } catch (e) {}
  }

  // Modulate Drone Filter per Scene Dynamics
  function setDroneFilterCutoff(targetFreq, duration = 1.2) {
    if (!droneFilter || !audioCtx) return;
    droneFilter.frequency.cancelScheduledValues(audioCtx.currentTime);
    droneFilter.frequency.exponentialRampToValueAtTime(
      Math.max(80, Math.min(4000, targetFreq)),
      audioCtx.currentTime + duration
    );
  }

  // =========================================================================
  // CINEMATIC SOUND EFFECT GENERATORS
  // =========================================================================

  /**
   * 1. Massive Film Trailer Sub-Bass Impact (Drop Boom)
   */
  function playCinematicBoom(baseFreq = 95, duration = 2.0) {
    if (!audioActive || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      // Sub drop oscillator
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(26, now + duration * 0.85);

      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Filtered punch transient (click/thud)
      const thud = audioCtx.createOscillator();
      const thudGain = audioCtx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(oscGain);
      thud.connect(thudGain);

      oscGain.connect(masterFilter);
      thudGain.connect(masterFilter);
      oscGain.connect(reverbNode);

      osc.start(now);
      thud.start(now);
      osc.stop(now + duration);
      thud.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * 2. 3D Spatial Doppler Noise Whoosh (Particles flying past camera)
   */
  function playDopplerWhoosh(duration = 0.75, panDirection = 1) {
    if (!audioActive || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      // Noise buffer generator
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Sweeping bandpass filter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(160, now + duration);
      filter.Q.setValueAtTime(3.0, now);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(-0.7 * panDirection, now);
        panner.pan.linearRampToValueAtTime(0.7 * panDirection, now + duration);
      }

      noise.connect(filter);
      filter.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(masterFilter);
        panner.connect(reverbNode);
      } else {
        gain.connect(masterFilter);
        gain.connect(reverbNode);
      }

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {}
  }

  /**
   * 3. Tactile Typewriter Acoustic Micro-Click (Natural Language Intent)
   */
  function playTypewriterClick(pitchOffset = 0) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950 + pitchOffset, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(masterFilter);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  /**
   * 4. Accelerating Real-time Data Ingestion Tick (Stereo Ping-Pong)
   */
  function playDataTick(stepIdx = 0) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      const baseFreq = 420 + stepIdx * 90;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      if (panner) {
        panner.pan.setValueAtTime((stepIdx % 2 === 0 ? -0.55 : 0.55), now);
      }

      osc.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(masterFilter);
      } else {
        gain.connect(masterFilter);
      }

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  /**
   * 5. Pentatonic Cluster Harmonic Chord (Scene 05 Intelligence Awakens)
   */
  function playClusterChord(idx = 0) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const pentatonic = [432, 486, 576, 648, 729];
      const freq = pentatonic[idx % pentatonic.length];

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(masterFilter);
      gain.connect(reverbNode);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch (e) {}
  }

  /**
   * 6. Pure Crystal Singing Bowl / Harmonic Insight Bell (528 Hz)
   */
  function playGlassBell(baseFreq = 528) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const partials = [1, 2.01, 3.04];
      const gains = [0.12, 0.04, 0.015];

      partials.forEach((mult, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * mult, now);

        gain.gain.setValueAtTime(gains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(masterFilter);
        gain.connect(reverbNode);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch (e) {}
  }

  /**
   * 7. Low-Mid Cinematic Brass Impact (Scene 07 The Moment of Decision)
   */
  function playBrahmsBrass(freq = 65) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const oscFilter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(180, now);
      oscFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      oscFilter.frequency.exponentialRampToValueAtTime(220, now + 1.5);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(oscFilter);
      oscFilter.connect(gain);
      gain.connect(masterFilter);
      gain.connect(reverbNode);

      osc.start(now);
      osc.stop(now + 1.85);
    } catch (e) {}
  }

  /**
   * 8. Spatial Stereo Arpeggio (Scene 08 Pipeline 7 Stages)
   */
  function playSpatialArpeggio(step = 0) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
      const freq = scale[step % scale.length];

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      // Pan from -0.8 (left) to +0.8 (right) across the 7 stages
      if (panner) {
        const panVal = -0.8 + (step / 6) * 1.6;
        panner.pan.setValueAtTime(panVal, now);
      }

      osc.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(masterFilter);
        panner.connect(reverbNode);
      } else {
        gain.connect(masterFilter);
        gain.connect(reverbNode);
      }

      osc.start(now);
      osc.stop(now + 0.48);
    } catch (e) {}
  }

  /**
   * 9. Multiple Worlds Sector Acoustic Timbre
   */
  function playWorldTone(worldType) {
    if (!audioActive || !audioCtx) return;
    switch (worldType) {
      case 'education': playGlassBell(660); break;
      case 'hr': playClusterChord(2); break;
      case 'research': playTypewriterClick(400); break;
      case 'events': playSpatialArpeggio(5); break;
      default: playGlassBell(440);
    }
  }

  /**
   * 10. Technology Exploded Stack Glass Plane Click
   */
  function playLayerClick(layerIdx) {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + layerIdx * 120, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(masterFilter);
      gain.connect(reverbNode);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  /**
   * 11. Harmonic Transformation Progression Cycle
   */
  function playChordProgression(phaseIdx) {
    if (!audioActive || !audioCtx) return;
    const chords = [
      [220, 330, 440],       // Am
      [261.63, 329.63, 392], // C
      [293.66, 369.99, 440], // D
      [349.23, 440, 523.25], // F
      [392, 493.88, 587.33]  // G
    ];
    const notes = chords[phaseIdx % chords.length];
    notes.forEach((f) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.1);

      osc.connect(gain);
      gain.connect(masterFilter);
      gain.connect(reverbNode);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.15);
    });
  }

  /**
   * 12. Grand Film Resolution Chord (Scene 12 Finale)
   */
  function playFinaleResolution() {
    if (!audioActive || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const chord = [130.81, 196.00, 261.63, 329.63, 392.00, 493.88]; // Cmaj9 / E ethereal chord
      chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = idx < 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

        osc.connect(gain);
        gain.connect(masterFilter);
        gain.connect(reverbNode);

        osc.start(now);
        osc.stop(now + 4.6);
      });
      playCinematicBoom(55, 3.5);
    } catch (e) {}
  }

  /**
   * Subtle Ethereal Cursor Sparkle (High-frequency harmonic particle)
   */
  function triggerMouseSparkle() {
    if (!audioActive || !audioCtx) return;
    const now = Date.now();
    if (now - lastSparkleTime < 140) return; // Throttled
    lastSparkleTime = now;

    try {
      const cTime = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const freqs = [1760, 2093, 2349, 2637, 3135];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], cTime);

      gain.gain.setValueAtTime(0.008, cTime); // Barely audible, expensive acoustic sheen
      gain.gain.exponentialRampToValueAtTime(0.0001, cTime + 0.05);

      osc.connect(gain);
      gain.connect(masterFilter);

      osc.start(cTime);
      osc.stop(cTime + 0.06);
    } catch (e) {}
  }

  window.addEventListener('mousemove', triggerMouseSparkle);

  // =========================================================================
  // REAL-TIME AUDIO VISUALIZER (CANVAS FFT BARS IN HUD)
  // =========================================================================
  function startVisualizerLoop() {
    if (!audioVisCanvas) return;
    const ctx = audioVisCanvas.getContext('2d');
    const width = audioVisCanvas.width;
    const height = audioVisCanvas.height;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      if (!audioActive || !analyserNode) {
        // Flat resting line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, height / 2 - 0.5, width, 1);
        return;
      }

      analyserNode.getByteFrequencyData(dataArray);

      const barCount = 12;
      const barWidth = 3;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * 2] || 0;
        const barHeight = Math.max(2, (val / 255) * height);
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        // Gradient from cyan to white
        const grad = ctx.createLinearGradient(0, y, 0, height);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#00f0ff');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    draw();
  }

  // =========================================================================
  // AUDIO TOGGLE & ONBOARDING CONTROLS
  // =========================================================================
  function toggleAudio() {
    initAudioEngine();
    audioActive = !audioActive;

    if (audioToggle) audioToggle.classList.toggle('active', audioActive);
    if (audioLabel) audioLabel.textContent = audioActive ? 'Spatial Audio' : 'Sound Off';

    if (audioActive) {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      startSubharmonicDrone();
      playGlassBell(528);
      if (audioPromptPill) audioPromptPill.classList.add('dismissed');
    } else {
      stopSubharmonicDrone();
    }
  }

  if (audioToggle) audioToggle.addEventListener('click', toggleAudio);

  if (pillEnableBtn) {
    pillEnableBtn.addEventListener('click', () => {
      if (!audioActive) toggleAudio();
      if (audioPromptPill) audioPromptPill.classList.add('dismissed');
    });
  }

  if (pillDismissBtn) {
    pillDismissBtn.addEventListener('click', () => {
      if (audioPromptPill) audioPromptPill.classList.add('dismissed');
    });
  }

  // Fullscreen Handler
  if (fsToggle) {
    fsToggle.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    });
  }

  // =========================================================================
  // 2. SCENE 01 — THE VOID (LETTER-BY-LETTER FILM OPENING)
  // =========================================================================
  function runScene01FilmOpening() {
    const chars = Array.from(document.querySelectorAll('#void-q1 .type-char'));
    const voidQ2 = document.getElementById('void-q2');
    const brandEmergence = document.getElementById('brand-emergence');

    // Chime scale notes for letter reveals
    const letterNotes = [659.25, 830.61, 987.77, 1318.51, 1661.22];

    chars.forEach((c, idx) => {
      setTimeout(() => {
        c.classList.add('typed');
        if (idx % 2 === 0 && audioActive) {
          playGlassBell(letterNotes[idx % letterNotes.length]);
        }
      }, 500 + idx * 75);
    });

    const totalTypingTime = 500 + chars.length * 75;

    // Reveal "YOU GET RESPONSES." -> Trigger Sub-Bass Boom!
    setTimeout(() => {
      if (voidQ2) voidQ2.classList.add('revealed');
      playCinematicBoom(90, 2.2);
    }, totalTypingTime + 650);

    // Reveal FORMIQ Monumental Logo -> Warm Triumphant Chord!
    setTimeout(() => {
      if (brandEmergence) brandEmergence.classList.add('revealed');
      playFinaleResolution();
    }, totalTypingTime + 1850);
  }

  // =========================================================================
  // 3. SCENE 03 — INTERACTIVE FORM INTENT TYPING
  // =========================================================================
  let promptTyped = false;
  function triggerFormPromptTyping() {
    if (promptTyped) return;
    promptTyped = true;
    const promptEl = document.getElementById('prompt-text-live');
    if (!promptEl) return;

    const fullPrompt = '"Create a student feedback form about laboratory facilities."';
    promptEl.textContent = '';
    let pIdx = 0;

    const typeTimer = setInterval(() => {
      if (pIdx < fullPrompt.length) {
        promptEl.textContent += fullPrompt.charAt(pIdx);
        if (pIdx % 2 === 0) playTypewriterClick((pIdx % 6) * 40);
        pIdx++;
      } else {
        clearInterval(typeTimer);
        // Form generation chime
        playGlassBell(660);

        // Highlight form cards
        const cards = Array.from(document.querySelectorAll('.form-question-card'));
        cards.forEach((card, ci) => {
          setTimeout(() => {
            card.style.borderColor = 'var(--border-cyan)';
            playTypewriterClick(ci * 80);
            setTimeout(() => card.style.borderColor = '', 600);
          }, ci * 200);
        });
      }
    }, 45);
  }

  // =========================================================================
  // 4. SCENE 04 — REAL-TIME RESPONSE COUNTER ACCELERATION
  // =========================================================================
  let counterAnimated = false;
  function triggerResponseCounter() {
    if (counterAnimated) return;
    counterAnimated = true;
    const counterVal = document.getElementById('counter-val');
    if (!counterVal) return;

    const milestones = [1, 10, 50, 100, 250, 500];
    let mIdx = 0;

    function nextMilestone() {
      if (mIdx < milestones.length) {
        counterVal.textContent = milestones[mIdx];
        playDataTick(mIdx);
        mIdx++;
        setTimeout(nextMilestone, 220);
      } else {
        // Massive Sub-Impact at 500 Responses!
        playCinematicBoom(110, 2.5);
      }
    }
    nextMilestone();
  }

  // =========================================================================
  // 5. SCENE 05 — CLUSTERS SVG VECTOR CONNECTIONS
  // =========================================================================
  function renderClusterVectors() {
    const svg = document.getElementById('cluster-svg');
    const stage = document.getElementById('clusters-stage');
    if (!svg || !stage) return;

    const nodes = Array.from(document.querySelectorAll('.cluster-node'));
    if (nodes.length < 5) return;

    const stageRect = stage.getBoundingClientRect();
    const coords = nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return {
        x: r.left - stageRect.left + r.width / 2,
        y: r.top - stageRect.top + r.height / 2
      };
    });

    let pathsHtml = '';
    const center = coords[4];
    for (let i = 0; i < 4; i++) {
      const p = coords[i];
      pathsHtml += `
        <line x1="${center.x}" y1="${center.y}" x2="${p.x}" y2="${p.y}" 
              stroke="rgba(0, 240, 255, 0.25)" stroke-width="1.5" stroke-dasharray="4 4" />
      `;
    }

    svg.innerHTML = pathsHtml;
    playClusterChord(0);
  }

  window.addEventListener('resize', renderClusterVectors);

  // Cluster node hover interactions
  document.querySelectorAll('.cluster-node').forEach((node, idx) => {
    node.addEventListener('mouseenter', () => {
      playClusterChord(idx);
    });
  });

  // =========================================================================
  // 6. SCENE 06 — MULTI-VARIABLE LENS SWITCHING
  // =========================================================================
  const lensTabs = Array.from(document.querySelectorAll('.lens-tab'));
  const lensViews = {
    trend: document.getElementById('view-trend'),
    sentiment: document.getElementById('view-sentiment'),
    group: document.getElementById('view-group'),
    issue: document.getElementById('view-issue')
  };

  lensTabs.forEach((tab, tIdx) => {
    tab.addEventListener('click', () => {
      const targetLens = tab.getAttribute('data-lens');
      lensTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(lensViews).forEach((k) => {
        if (lensViews[k]) lensViews[k].classList.toggle('active', k === targetLens);
      });

      playGlassBell(440 + tIdx * 88);
    });
  });

  // =========================================================================
  // 7. SCENE 08 — PIPELINE STAGE HOVER
  // =========================================================================
  document.querySelectorAll('.p-node').forEach((node, idx) => {
    node.addEventListener('mouseenter', () => {
      playSpatialArpeggio(idx);
    });
  });

  // =========================================================================
  // 8. SCENE 09 — MULTIPLE WORLDS HOVER
  // =========================================================================
  document.querySelectorAll('.world-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const world = card.getAttribute('data-world');
      playWorldTone(world);
    });
  });

  // =========================================================================
  // 9. SCENE 10 — EXPLODED ARCHITECTURE STACK HOVER
  // =========================================================================
  document.querySelectorAll('.stack-layer-row').forEach((row, idx) => {
    row.addEventListener('mouseenter', () => {
      playLayerClick(idx);
    });
  });

  // =========================================================================
  // 10. SCENE 11 — THE CONTINUOUS TRANSFORMATION CYCLE
  // =========================================================================
  const transformPhases = [
    { title: 'RAW RESPONSES', desc: 'Scattered freeform comments flow into the unified ingestion engine.' },
    { title: 'STRUCTURED DATA', desc: 'Normalized schemas, validated demographics, and verified cohorts.' },
    { title: 'UNDERSTANDING', desc: 'Semantic vectors isolate root causes and group friction points.' },
    { title: 'DECISION', desc: 'Algorithmic prioritization converts findings into concrete imperatives.' },
    { title: 'ACTION', desc: 'Leadership executes targeted operational plans with zero guesswork.' }
  ];

  let currentPhaseIdx = 0;
  const transformLabel = document.getElementById('transform-label');
  const transformDesc = document.getElementById('transform-desc');
  const cyclePills = Array.from(document.querySelectorAll('.cycle-pill'));

  function cycleTransformation() {
    currentPhaseIdx = (currentPhaseIdx + 1) % transformPhases.length;
    const phase = transformPhases[currentPhaseIdx];

    if (transformLabel) transformLabel.textContent = phase.title;
    if (transformDesc) transformDesc.textContent = phase.desc;

    cyclePills.forEach((p, idx) => {
      p.classList.toggle('active', idx === currentPhaseIdx);
    });

    if (activeSceneIndex === 11) {
      playChordProgression(currentPhaseIdx);
    }
  }

  setInterval(cycleTransformation, 2800);

  // =========================================================================
  // 11. SCENE 12 — FINAL FILM PACING
  // =========================================================================
  let finalRevealed = false;
  function triggerFinalReveal() {
    if (finalRevealed) return;
    finalRevealed = true;
    const brandReveal = document.getElementById('film-brand-reveal');
    setTimeout(() => {
      if (brandReveal) brandReveal.classList.add('visible');
      playFinaleResolution();
    }, 1200);
  }

  // =========================================================================
  // 12. SCENE TRANSITION OBSERVER & MASTER TELEMETRY
  // =========================================================================
  function updateSceneTelemetry(sceneIdx) {
    activeSceneIndex = sceneIdx;

    // Update HUD
    const padded = String(sceneIdx).padStart(2, '0');
    if (hudSceneIndex) hudSceneIndex.textContent = padded;
    if (hudSceneName) hudSceneName.textContent = SCENE_NAMES[sceneIdx - 1] || '';

    const progressPct = (sceneIdx / TOTAL_SCENES) * 100;
    if (hudProgressBar) hudProgressBar.style.width = `${progressPct}%`;

    // HUD Visibility: Fade in softly after Scene 01
    if (hud) {
      hud.style.opacity = sceneIdx > 1 ? '1' : '0.65';
    }

    // Pass Active Scene to Three.js WebGL Engine!
    if (window.setCinematicScene) {
      window.setCinematicScene(sceneIdx);
    }

    // Dynamic Drone Filter Modulation based on Active Scene
    const sceneFilterFrequencies = [
      320,  // Scene 01 The Void (Dark, mysterious)
      2600, // Scene 02 Chaos (Wide open)
      850,  // Scene 03 Form (Focused)
      1800, // Scene 04 Collect (Rising tension)
      1200, // Scene 05 Intelligence
      450,  // Scene 06 Insight (Negative space, deep warmth)
      2200, // Scene 07 Decision (Action impact)
      1400, // Scene 08 Pipeline
      1100, // Scene 09 Multiple Worlds
      1500, // Scene 10 Technology
      1300, // Scene 11 Transformation
      300   // Scene 12 Final (Warm silence)
    ];
    setDroneFilterCutoff(sceneFilterFrequencies[sceneIdx - 1] || 1000);

    // Scene-specific sound design triggers
    switch (sceneIdx) {
      case 2:
        playDopplerWhoosh(0.85, 1);
        setTimeout(() => playDopplerWhoosh(0.7, -1), 400);
        break;
      case 3:
        triggerFormPromptTyping();
        break;
      case 4:
        triggerResponseCounter();
        break;
      case 5:
        renderClusterVectors();
        break;
      case 6:
        playGlassBell(528);
        break;
      case 7:
        playBrahmsBrass(65);
        break;
      case 8:
        playSpatialArpeggio(0);
        break;
      case 12:
        triggerFinalReveal();
        break;
      default:
        if (sceneIdx > 1) playGlassBell(440);
        break;
    }
  }

  // Intersection Observer on Scene Frames
  const observerOptions = {
    root: container,
    threshold: 0.55
  };

  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.getAttribute('data-scene'), 10);
        if (!isNaN(idx) && idx !== activeSceneIndex) {
          updateSceneTelemetry(idx);
        }
      }
    });
  }, observerOptions);

  sceneFrames.forEach((frame) => sceneObserver.observe(frame));

  // Navigation Function
  function goToScene(index) {
    if (index < 1 || index > TOTAL_SCENES) return;
    const target = sceneFrames[index - 1];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateSceneTelemetry(index);
    }
  }

  // Keyboard Navigation (<kbd>↓</kbd> / <kbd>→</kbd> / <kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>←</kbd>)
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        goToScene(activeSceneIndex + 1);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        goToScene(activeSceneIndex - 1);
        break;

      case 'Home':
        e.preventDefault();
        goToScene(1);
        break;

      case 'End':
        e.preventDefault();
        goToScene(TOTAL_SCENES);
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        if (fsToggle) fsToggle.click();
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        if (audioToggle) audioToggle.click();
        break;
    }
  });

  // Kick off Scene 01 Film Opening Sequence
  runScene01FilmOpening();
  updateSceneTelemetry(1);

})();
