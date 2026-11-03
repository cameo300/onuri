(() => {
  'use strict';
  const tracks = [
    { title: '한옥의 아침', mood: '차분한 아침 · 편안한 집중', file: 'hanok-morning.mp3' },
    { title: '달빛 궁궐', mood: '고요한 밤 · 몽환적인 휴식', file: 'moonlight-palace.mp3' },
    { title: '도깨비 산책', mood: '장난스러운 산책 · 가벼운 상상', file: 'dokkaebi-walk.mp3' },
    { title: '풍류 재즈', mood: '느긋한 재즈 · 여유로운 창작', file: 'pungryu-jazz.mp3' },
    { title: '처마 끝 빗방울', mood: '잔잔한 빗소리 · 차분한 휴식', file: 'Rain_on_Paper_Windows.mp3' },
    { title: '대숲의 오후', mood: '싱그러운 대숲 · 느긋한 오후', file: 'Bamboo_Courtyard_Noon.mp3' }
  ];
  const root = document.getElementById('music-player');
  if (!root) return;
  const audio = root.querySelector('audio');
  const el = id => root.querySelector(`#music-${id}`);
  const key = 'onuri-music';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  let current = Math.max(0, tracks.findIndex(track => track.file === saved.file));
  let repeat = saved.repeat === 'one' ? 'one' : 'all';
  let generation = 0;
  let wantsPlay = false;
  let seeking = false;
  // Apply the quieter default once, including browsers that saved the old 50% default.
  audio.volume = saved.volumeVersion === 2 && typeof saved.volume === 'number' && Number.isFinite(saved.volume)
    ? Math.min(1, Math.max(0, saved.volume)) : 0.05;
  const urls = tracks.map(track => new URL(`audio/${track.file}`, document.baseURI).href);
  const persist = () => {
    try { localStorage.setItem(key, JSON.stringify({ file: tracks[current].file, volume: audio.volume, volumeVersion: 2, repeat })); } catch (_) {}
  };
  const clock = value => {
    if (!Number.isFinite(value)) return '0:00';
    return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };
  function renderList() {
    el('list').replaceChildren(...tracks.map((track, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'music-track';
      button.setAttribute('aria-current', index === current ? 'true' : 'false');
      button.disabled = track.missing === true;
      const name = document.createElement('strong');
      name.textContent = `${index + 1}. ${track.title}`;
      const mood = document.createElement('span');
      mood.textContent = track.missing ? '음악 파일 준비 중' : track.mood;
      button.append(name, mood);
      button.addEventListener('click', () => select(index, wantsPlay));
      item.append(button);
      return item;
    }));
  }
  function update() {
    el('title').textContent = tracks[current].title;
    el('mood').textContent = tracks[current].mood;
    el('play').textContent = audio.paused ? '▶' : 'Ⅱ';
    el('play').setAttribute('aria-label', audio.paused ? '재생' : '일시정지');
    el('play').disabled = tracks[current].missing === true;
    el('mute').textContent = audio.muted ? '음소거 해제' : '음소거';
    el('mute').setAttribute('aria-pressed', String(audio.muted));
    el('volume').value = audio.volume;
    el('repeat').value = repeat;
    el('compact-title').textContent = tracks[current].title;
  }
  async function play() {
    const version = generation;
    wantsPlay = true;
    try {
      await audio.play();
      if (version === generation) el('status').textContent = '';
    } catch (error) {
      if (version !== generation || error.name === 'AbortError') return;
      wantsPlay = false;
      el('status').textContent = tracks[current].missing ? '음악 파일 준비 중' : '재생 버튼을 눌러 다시 시도해 주세요.';
      update();
    }
  }
  function select(index, autoplay = false) {
    generation++;
    audio.pause();
    current = index;
    wantsPlay = autoplay;
    audio.src = urls[current];
    audio.load();
    el('seek').value = 0;
    el('seek').disabled = true;
    el('time').textContent = '0:00 / 0:00';
    el('status').textContent = tracks[current].missing ? '음악 파일 준비 중' : '';
    persist(); renderList(); update();
    if (autoplay && !tracks[current].missing) void play();
  }
  function move(direction, autoplay = wantsPlay) {
    for (let step = 1; step <= tracks.length; step++) {
      const index = (current + direction * step + tracks.length) % tracks.length;
      if (!tracks[index].missing) { select(index, autoplay); return; }
    }
    wantsPlay = false;
    audio.pause();
    el('status').textContent = '음악 파일 준비 중';
    update();
  }
  el('play').addEventListener('click', () => {
    if (audio.paused) void play();
    else { wantsPlay = false; audio.pause(); }
  });
  el('stop').addEventListener('click', () => {
    wantsPlay = false; audio.pause(); audio.currentTime = 0;
  });
  el('prev').addEventListener('click', () => move(-1));
  el('next').addEventListener('click', () => move(1));
  el('mute').addEventListener('click', () => { audio.muted = !audio.muted; });
  el('volume').addEventListener('input', event => {
    audio.volume = Number(event.target.value); audio.muted = false; persist(); update();
  });
  el('repeat').addEventListener('change', event => { repeat = event.target.value; persist(); });
  el('seek').addEventListener('input', () => { seeking = true; });
  el('seek').addEventListener('change', event => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.target.value) / 1000;
    seeking = false;
  });
  el('collapse').addEventListener('click', () => {
    const collapsed = !el('body').hidden;
    el('body').hidden = collapsed;
    el('collapse').setAttribute('aria-expanded', String(!collapsed));
    el('collapse').textContent = collapsed ? '펼치기' : '접기';
  });
  audio.addEventListener('play', update);
  audio.addEventListener('pause', update);
  audio.addEventListener('volumechange', update);
  audio.addEventListener('loadedmetadata', () => { el('seek').disabled = !Number.isFinite(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    if (!seeking) el('seek').value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration * 1000 : 0;
    el('time').textContent = `${clock(audio.currentTime)} / ${clock(audio.duration)}`;
  });
  audio.addEventListener('ended', () => {
    if (!wantsPlay) return;
    if (repeat === 'one') { audio.currentTime = 0; void play(); }
    else move(1, true);
  });
  audio.addEventListener('error', () => {
    if (audio.error?.code === 1) return;
    const continuePlaying = wantsPlay;
    tracks[current].missing = true;
    el('status').textContent = '음악 파일 준비 중';
    renderList(); update();
    if (continuePlaying) move(1, true);
  });
  select(current); // Restore selection and volume, never autoplay on a new visit.
  // Probe availability without additional audio elements; loading/playback still handles network failures.
  if (location.protocol !== 'file:') {
    tracks.forEach(async (track, index) => {
      try {
        const response = await fetch(urls[index], { method: 'HEAD' });
        if (response.status === 404 || response.status === 410) {
          track.missing = true; renderList(); update();
          if (index === current) {
            el('status').textContent = '음악 파일 준비 중';
            if (wantsPlay) move(1, true);
          }
        }
      } catch (_) { /* Do not mark temporary network failures as missing. */ }
    });
  }
})();
