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
  let repeat = ['all', 'one', 'off'].includes(saved.repeat) ? saved.repeat : 'all';
  let shuffle = saved.shuffle === true;
  let shuffleBag = [];
  const history = [];
  const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const repeatIcon = '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>';
  el('prev').innerHTML = svg('<path d="M6 5v14M19 5 8 12l11 7Z" fill="currentColor" stroke="none"/><path d="M5 5v14"/>');
  el('next').innerHTML = svg('<path d="m5 5 11 7-11 7Z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>');
  el('stop').innerHTML = svg('<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/>');
  el('shuffle').innerHTML = svg('<path d="m18 3 3 3-3 3M3 6h3c5 0 7 12 12 12h3m-3-3 3 3-3 3M3 18h3c2 0 4-3 6-6s4-6 6-6h3"/>');
  let generation = 0;
  let wantsPlay = false;
  let seeking = false;
  // Apply the quieter default once, including browsers that saved the old 50% default.
  audio.volume = saved.volumeVersion === 2 && typeof saved.volume === 'number' && Number.isFinite(saved.volume)
    ? Math.min(1, Math.max(0, saved.volume)) : 0.05;
  const urls = tracks.map(track => new URL(`audio/${track.file}`, document.baseURI).href);
  const persist = () => {
    try { localStorage.setItem(key, JSON.stringify({ file: tracks[current].file, volume: audio.volume, volumeVersion: 2, repeat, shuffle })); } catch (_) {}
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
    el('play').innerHTML = svg(audio.paused ? '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>' : '<path d="M8 5v14m8-14v14" stroke-width="4"/>');
    el('play').setAttribute('aria-label', audio.paused ? '재생' : '일시정지');
    el('play').setAttribute('title', audio.paused ? '재생' : '일시정지');
    el('play').setAttribute('aria-pressed', String(!audio.paused));
    el('play').disabled = tracks[current].missing === true;
    el('volume').value = audio.volume;
    const repeatLabels = { all: '전체 반복', one: '한 곡 반복', off: '반복 끄기' };
    el('repeat').innerHTML = svg(repeatIcon + (repeat === 'one' ? '<path d="m10 10 2-1v6m-2 0h4"/>' : repeat === 'off' ? '<path d="m4 3 16 18"/>' : ''));
    el('repeat').setAttribute('aria-label', `${repeatLabels[repeat]} · 눌러서 변경`);
    el('repeat').setAttribute('title', repeatLabels[repeat]);
    el('repeat').setAttribute('aria-pressed', String(repeat !== 'off'));
    el('shuffle').setAttribute('aria-pressed', String(shuffle));
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
    if (shuffle) {
      if (direction < 0 && history.length) { select(history.pop(), autoplay); return; }
      shuffleBag = shuffleBag.filter(index => index !== current && !tracks[index].missing);
      if (!shuffleBag.length) shuffleBag = tracks.map((_, index) => index).filter(index => index !== current && !tracks[index].missing);
      if (shuffleBag.length) {
        const index = shuffleBag.splice(Math.floor(Math.random() * shuffleBag.length), 1)[0];
        history.push(current); select(index, autoplay); return;
      }
    }
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
  el('volume').addEventListener('input', event => {
    audio.volume = Number(event.target.value); audio.muted = false; persist(); update();
  });
  el('repeat').addEventListener('click', () => {
    repeat = { all: 'one', one: 'off', off: 'all' }[repeat]; persist(); update();
  });
  el('shuffle').addEventListener('click', () => {
    shuffle = !shuffle; shuffleBag = []; history.length = 0; persist(); update();
  });
  el('seek').addEventListener('input', () => { seeking = true; });
  el('seek').addEventListener('change', event => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.target.value) / 1000;
    seeking = false;
  });
  el('collapse').addEventListener('click', () => {
    const collapsed = !el('body').hidden;
    el('body').hidden = collapsed;
    el('collapse').setAttribute('aria-expanded', String(!collapsed));
    el('collapse').innerHTML = svg(collapsed ? '<path d="m6 9 6 6 6-6"/>' : '<path d="m6 15 6-6 6 6"/>');
    el('collapse').setAttribute('aria-label', collapsed ? '플레이어 펼치기' : '플레이어 접기');
    el('collapse').setAttribute('title', collapsed ? '펼치기' : '접기');
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
    else if (repeat === 'off') {
      if (shuffle) {
        const visited = new Set([...history, current]);
        shuffleBag = tracks.map((_, index) => index).filter(index => !visited.has(index) && !tracks[index].missing);
        if (shuffleBag.length) move(1, true);
        else { wantsPlay = false; audio.pause(); update(); }
      } else {
        const next = tracks.findIndex((track, index) => index > current && !track.missing);
        if (next >= 0) select(next, true);
        else { wantsPlay = false; audio.pause(); update(); }
      }
    } else move(1, true);
  });
  audio.addEventListener('error', () => {
    if (audio.error?.code === 1) return;
    const continuePlaying = wantsPlay;
    tracks[current].missing = true;
    el('status').textContent = '음악 파일 준비 중';
    renderList(); update();
    if (continuePlaying) move(1, true);
  });
  el('playlist').open = false;
  el('body').hidden = true;
  el('collapse').setAttribute('aria-expanded', 'false');
  el('collapse').innerHTML = svg('<path d="m6 9 6 6 6-6"/>');
  el('collapse').setAttribute('aria-label', '플레이어 펼치기');
  el('collapse').setAttribute('title', '펼치기');
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
