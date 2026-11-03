const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/audio-player.js'), 'utf8');

function setup(saved = null, missing = []) {
  class Element {
    constructor() { this.listeners = {}; this.attrs = {}; this.value = 0; this.hidden = false; this.children = []; }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    emit(name) { for (const fn of this.listeners[name] || []) fn({ target: this }); }
    setAttribute(name, value) { this.attrs[name] = value; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
  }
  const audio = new Element();
  Object.assign(audio, { paused: true, currentTime: 0, duration: 120, muted: false, volume: 0.5, plays: 0 });
  audio.play = async () => { audio.paused = false; audio.plays++; audio.emit('play'); };
  audio.pause = () => { audio.paused = true; audio.emit('pause'); };
  audio.load = () => { audio.currentTime = 0; };
  const ids = ['list','title','mood','play','mute','volume','repeat','playlist','shuffle','compact-title','seek','time','status','stop','prev','next','collapse','body'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  const root = { querySelector: selector => selector === 'audio' ? audio : elements[selector.slice(7)] };
  const storage = new Map(saved ? [['onuri-music', JSON.stringify(saved)]] : []);
  vm.runInNewContext(source, {
    document: { baseURI: 'https://example.test/onuri/', getElementById: () => root, createElement: () => new Element() },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    location: { protocol: 'https:' }, URL,
    fetch: async url => ({ status: missing.some(file => url.endsWith(file)) ? 404 : 200 })
  });
  return { audio, elements, storage, click: id => elements[id].emit('click'), track: i => elements.list.children[i].children[0] };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('repeat off stops at last song and mode buttons persist', async () => {
  const p = setup({ file: 'Bamboo_Courtyard_Noon.mp3', repeat: 'off' });
  p.click('play'); await tick();
  const plays = p.audio.plays;
  p.audio.emit('ended'); await tick();
  assert.equal(p.audio.plays, plays);
  assert.equal(p.audio.paused, true);
  p.click('repeat');
  assert.equal(JSON.parse(p.storage.get('onuri-music')).repeat, 'all');
  p.click('shuffle');
  assert.equal(JSON.parse(p.storage.get('onuri-music')).shuffle, true);
});

test('shuffle visits every song once without repeating when repeat is off', async () => {
  const p = setup({ repeat: 'off', shuffle: true });
  p.click('play'); await tick();
  const visited = new Set([p.audio.src]);
  for (let i = 0; i < 5; i++) {
    p.audio.emit('ended'); await tick();
    assert.equal(visited.has(p.audio.src), false);
    visited.add(p.audio.src);
  }
  p.audio.emit('ended'); await tick();
  assert.equal(visited.size, 6);
  assert.equal(p.audio.paused, true);
  assert.equal(p.audio.plays, 6);
});

test('restores valid selection/volume without autoplay and uses repository subpath', () => {
  const p = setup({ file: 'moonlight-palace.mp3', volume: 0.3, volumeVersion: 2 });
  assert.equal(p.audio.src, 'https://example.test/onuri/audio/moonlight-palace.mp3');
  assert.equal(p.audio.volume, 0.3);
  assert.equal(p.audio.plays, 0);
  assert.equal(p.track(1).attrs['aria-current'], 'true');
});
test('switching preserves play/pause intent, resets time and supports stop', async () => {
  const p = setup();
  p.click('next');
  assert.equal(p.audio.paused, true);
  assert.match(p.audio.src, /moonlight-palace/);
  p.click('play'); await tick();
  p.audio.currentTime = 52;
  p.click('next'); await tick();
  assert.equal(p.audio.paused, false);
  assert.equal(p.audio.currentTime, 0);
  assert.match(p.audio.src, /dokkaebi-walk/);
  p.click('play');
  p.track(3).emit('click');
  assert.equal(p.audio.paused, true);
  assert.match(p.audio.src, /pungryu-jazz/);
  p.click('stop'); assert.equal(p.audio.currentTime, 0);
});
test('all-repeat wraps and single-repeat stays on the same song', async () => {
  const p = setup({ file: 'Bamboo_Courtyard_Noon.mp3' });
  p.click('play'); await tick();
  p.audio.emit('ended'); await tick();
  assert.match(p.audio.src, /hanok-morning/);
  p.click('repeat');
  p.audio.currentTime = 120; p.audio.emit('ended'); await tick();
  assert.match(p.audio.src, /hanok-morning/);
  assert.equal(p.audio.currentTime, 0);
});
test('missing tracks display preparation notice and are skipped; all missing terminates', async () => {
  const p = setup(null, ['hanok-morning.mp3']); await tick();
  assert.equal(p.track(0).disabled, true);
  assert.equal(p.track(0).children[1].textContent, '음악 파일 준비 중');
  p.click('next'); assert.match(p.audio.src, /moonlight-palace/);
  p.click('play'); await tick();
  p.audio.error = { code: 4 }; p.audio.emit('error'); await tick();
  assert.match(p.audio.src, /dokkaebi-walk/);
  const all = setup(null, ['.mp3']); await tick();
  all.click('next'); assert.equal(all.audio.paused, true);
  assert.equal(all.elements.status.textContent, '음악 파일 준비 중');
});
test('volume persists, seek and collapse controls remain usable', () => {
  const p = setup();
  p.elements.volume.value = '0.8'; p.elements.volume.emit('input');
  assert.equal(JSON.parse(p.storage.get('onuri-music')).volume, 0.8);
  p.elements.seek.value = '500'; p.elements.seek.emit('change');
  assert.equal(p.audio.currentTime, 60);
  p.click('mute'); assert.equal(p.audio.muted, true);
  assert.equal(p.elements.body.hidden, true);
  assert.equal(p.elements.collapse.attrs['aria-expanded'], 'false');
  assert.equal(p.elements.playlist.open, false);
  p.click('collapse'); assert.equal(p.elements.body.hidden, false);
  p.click('collapse'); assert.equal(p.elements.body.hidden, true);
});

test('quiet default migrates old volume and removed track without autoplay', () => {
  for (const saved of [null, { file: 'joseon-hiphop.mp3', volume: 0.9 }]) {
    const p = setup(saved);
    assert.equal(p.audio.volume, 0.05);
    assert.equal(p.audio.plays, 0);
    assert.match(p.audio.src, /hanok-morning/);
    assert.equal(p.elements.list.children.length, 6);
    p.track(4).emit('click');
    assert.match(p.audio.src, /Rain_on_Paper_Windows/);
    assert.equal(p.audio.plays, 0);
    p.track(5).emit('click');
    assert.match(p.audio.src, /Bamboo_Courtyard_Noon/);
    assert.equal(p.audio.plays, 0);
  }
});
