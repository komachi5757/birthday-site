/* 四段祝福共用儀式時鐘；播放失敗不阻擋畫面，重新播放會取消上一輪。 */
window.createMemorialSound = function (cfg, music, button) {
  const clamp = v => Math.max(0, Math.min(1, v));
  let tracks = [], prepared = false, unlocked = false, muted = false, start = -1, dawn = -1;
  let context, compressor, frame, musicFailed = false, musicPlaying = false;
  let musicRamp = { from: 0, to: .65, at: 0, duration: 4000 };
  const warn = (label, error) => console.warn('音訊略過：' + label, error?.name || '載入失敗');
  function bus(audio) {
    if (!context) return null;
    const gain = context.createGain(); gain.gain.value = 0;
    context.createMediaElementSource(audio).connect(gain).connect(compressor);
    audio.volume = 1;
    return gain;
  }
  let musicGain;
  function setLevel(audio, gain, value) {
    value = muted ? 0 : clamp(value);
    if (gain) gain.gain.setTargetAtTime(value, context.currentTime, .025);
    else audio.volume = value;
  }
  function prepare() {
    if (prepared) return;
    prepared = true;
    tracks = (Array.isArray(cfg.voices) ? cfg.voices : []).slice(0, 4).filter(v => v.src).map(v => {
      const audio = new Audio(); audio.preload = 'auto'; audio.src = v.src;
      const track = { audio, spec: v, gain: bus(audio), started: false, failed: false };
      audio.addEventListener('error', () => { if (!track.failed) warn(v.src); track.failed = true; });
      audio.load(); return track;
    });
  }
  function level(now) {
    const p = clamp((now - musicRamp.at) / musicRamp.duration), k = p * p * (3 - 2 * p);
    return musicRamp.from + (musicRamp.to - musicRamp.from) * k;
  }
  function fadeMusic(to, duration = 3000) {
    const now = performance.now(); musicRamp = { from: level(now), to, at: now, duration };
  }
  function tick(now) {
    setLevel(music, musicGain, level(now));
    for (const t of tracks) {
      if (t.failed) continue;
      const elapsed = start < 0 ? -1 : (now - start) / 1000 - Number(t.spec.at || 0);
      if (unlocked && elapsed >= 0 && !t.started) {
        t.started = true;
        t.audio.currentTime = Math.min(Math.max(0, elapsed), Number.isFinite(t.audio.duration) ? Math.max(0, t.audio.duration - .01) : elapsed);
        t.audio.play().catch(error => { t.failed = true; warn(t.spec.src, error); });
      }
      const attack = t.spec.fadeIn ? clamp(elapsed / t.spec.fadeIn) : 1;
      const release = dawn < 0 ? 1 : 1 - clamp((now - dawn) / (1000 * (Number(t.spec.fadeOutAtDawn) || 6)));
      setLevel(t.audio, t.gain, t.started ? (t.spec.vol ?? .8) * attack * release : 0);
      if (dawn >= 0 && release === 0) t.audio.pause();
    }
    frame = requestAnimationFrame(tick);
  }
  function unlock() {
    if (unlocked) { context?.resume().catch(() => {}); return; }
    unlocked = true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        context = new AudioContext(); compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -8; compressor.knee.value = 12; compressor.ratio.value = 4;
        compressor.connect(context.destination); musicGain = bus(music);
        for (const t of tracks) t.gain = bus(t.audio);
        context.resume().catch(error => warn('音訊輸出', error));
      }
    } catch (error) { warn('改用瀏覽器原生音量', error); }
    prepare();
    // 在同一次觸碰解鎖所有 HTMLAudioElement，支援送出回覆後及延遲的疊播。
    for (const t of tracks) {
      setLevel(t.audio, t.gain, 0);
      t.audio.play().then(() => { if (!t.started) { t.audio.pause(); t.audio.currentTime = 0; } }).catch(error => {
        if (error.name !== 'AbortError') warn(t.spec.src, error);
      });
    }
    if (cfg.music && !musicFailed) {
      music.src = cfg.music; setLevel(music, musicGain, 0);
      music.play().then(() => { musicPlaying = true; }).catch(error => warn(cfg.music, error));
    }
    musicRamp.at = performance.now();
    button.dataset.state = muted ? 'off' : 'on';
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function reset() {
    start = dawn = -1;
    for (const t of tracks) { t.audio.pause(); t.audio.currentTime = 0; t.started = false; setLevel(t.audio, t.gain, 0); }
    fadeMusic(.65, 3000);
  }
  music.addEventListener('error', () => { musicFailed = true; musicPlaying = false; warn(cfg.music); });
  button.addEventListener('click', () => {
    if (!unlocked) { unlock(); return; }
    muted = !muted; button.dataset.state = muted ? 'off' : 'on';
    button.setAttribute('aria-pressed', String(muted)); context?.resume().catch(() => {});
  });
  return {
    prepare, unlock, fadeMusic, reset,
    start() { prepare(); reset(); start = performance.now(); fadeMusic(cfg.voicesDuck ?? .2, 500); },
    dawn() { dawn = performance.now(); fadeMusic(.65, 4000); },
    // 僅供本機驗收讀取，不暴露錄音內容。
    status() { return { unlocked, muted, elapsed: start < 0 ? -1 : (performance.now() - start) / 1000, musicPlaying, musicLevel: level(performance.now()), tracks: tracks.map(t => ({ src: t.spec.src, at: t.spec.at, started: t.started, paused: t.audio.paused, time: t.audio.currentTime, volume: t.gain ? t.gain.gain.value : t.audio.volume, failed: t.failed })) }; }
  };
};
