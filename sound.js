/* 탭퀴즈 소리
 * 배경음악: 한 곡(16마디)을 처음에 미리 만들어 두고 끝없이 반복 재생합니다.
 *   시간 간격을 두고 음을 하나씩 예약하지 않아서, 폰이 바빠도 끊기지 않아요.
 *   모든 화면에서 같은 곡이 이어서 나와요.
 * TQSound.scene(이름)   음악 시작 (화면이 바뀌어도 곡은 끊기지 않고 이어짐)
 * TQSound.play('ok'|'ng'|'tick'|'start'|'fanfare')  효과음 한 번
 * 브라우저 정책상 사용자가 화면을 한 번 누른 뒤에만 소리가 나요.
 */
(function(){
  'use strict';
  var KEY = 'tq_sound';
  var on = true;
  try{ on = localStorage.getItem(KEY) !== 'off'; }catch(e){}

  /* 곡 설정: 120bpm, 4/4박, 한 마디 = 8칸(8분음표). 코드는 C-Am-F-G 4마디를 4번 반복 */
  var BPM = 120, BARS = 16, EIGHTH = 60 / BPM / 2, BAR = EIGHTH * 8;
  var CHORDS = [48, 45, 41, 43];                  /* C, Am, F, G (루트 MIDI 번호) */
  var ARP = [                                     /* 멜로디 패턴: 코드음(0 루트, 1 3음, 2 5음, 3 옥타브) */
    [0,1,2,1, 0,2,3,2],
    [2,1,0,1, 2,3,2,1],
    [0,2,1,2, 3,2,1,0],
    [1,2,3,2, 1,0,1,2]
  ];
  var BASS_OFF = [0,12,0,12,7,12,0,12];
  var BASS_VOL = [0.35,0.16,0.25,0.16,0.3,0.16,0.25,0.16];
  var TAIL = 1.5;                     /* 곡 끝에서 넘치는 소리는 처음에 이어 붙임 */

  var ctx = null, master = null, songBuf = null, songSrc = null;
  var songWanted = false, rendering = false;

  function mf(m){ return 440 * Math.pow(2, (m - 69) / 12); }

  /* ---- 음 만들기 (컨텍스트 c 에 그림: 실시간 재생용과 미리 만들기용 모두 사용) ---- */
  function note(c, dest, freq, t, dur, type, vol){
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.setValueAtTime(vol, t + dur - 0.03);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  /* 화음: 부드러운 톱니파를 낮은 필터로 걸러 길게 */
  function padNote(c, dest, freq, t, dur, vol){
    var o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.Q.value = 0.5;
    /* 직선으로 올리고 내려서, 앞 화음이 줄어드는 동안 뒤 화음이 커져 소리가 빈틈 없이 이어짐 */
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.3);
    g.gain.setValueAtTime(vol, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f); f.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function kick(c, dest, t){
    var o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.22);
  }
  function hit(c, dest, noise, freq, vol, dur, t){
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise; f.type = 'highpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function makeNoise(c){
    var b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
    for(var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeIR(c, sec){
    var len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
    for(var ch = 0; ch < 2; ch++){ var d = b.getChannelData(ch); for(var i = 0; i < len; i++){ d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); } }
    return b;
  }

  /* 곡 한 개를 통째로 그림 */
  function writeSong(c, dest, noise){
    for(var bar = 0; bar < BARS; bar++){
      var chordIdx = bar % CHORDS.length, root = CHORDS[chordIdx];
      var third = (root % 12 === 9) ? 3 : 4;      /* A(라)가 뿌리면 단조, 아니면 장조 */
      var tones = [root + 12, root + 12 + third, root + 19, root + 24];
      var grp = Math.floor(bar / CHORDS.length);  /* 4마디마다 멜로디 패턴을 바꿔서 반복 속에 변화 */
      var pat = ARP[(chordIdx + grp) % ARP.length];
      var t0 = bar * BAR;
      for(var v = 0; v < 3; v++) padNote(c, dest, mf(tones[v]), t0, BAR + 0.3, 0.03);
      for(var k = 0; k < 8; k++){
        var t = t0 + k * EIGHTH;
        note(c, dest, mf(root + BASS_OFF[k]), t, EIGHTH * 1.05, 'triangle', BASS_VOL[k]);
        note(c, dest, mf(tones[pat[k]]), t, EIGHTH * 1.1, 'triangle', 0.13);
        if(k === 0 || k === 4) kick(c, dest, t);
        if(k === 2 || k === 6) hit(c, dest, noise, 1800, 0.2, 0.16, t);
        if(k % 2 === 1 && k !== 7) hit(c, dest, noise, 7500, 0.04, 0.04, t);   /* 마디 끝 칸은 치지 않아 '틱' 소리를 없앰 */
      }
    }
  }

  /* 곡을 미리 계산해서 하나의 소리 덩어리로 만듦 (끝과 처음이 자연스럽게 이어지게) */
  function renderSong(){
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var sr = ctx.sampleRate;   /* 기기 재생 속도와 같게 만들어서, 반복 지점에서 소리를 다시 맞추느라 생기는 드르륵을 막음 */
    var loopLen = Math.round(BARS * BAR * sr);
    var off = new OAC(2, loopLen + Math.round(TAIL * sr), sr);
    var m = off.createGain(); m.gain.value = 0.8; m.connect(off.destination);
    var cv = off.createConvolver(); cv.buffer = makeIR(off, 2.0); cv.connect(m);
    var bus = off.createGain(); bus.gain.value = 0.8; bus.connect(m);
    var send = off.createGain(); send.gain.value = 0.25; bus.connect(send); send.connect(cv);
    writeSong(off, bus, makeNoise(off));
    return off.startRendering().then(function(rendered){
      var out = ctx.createBuffer(2, loopLen, sr);
      for(var ch = 0; ch < 2; ch++){
        var src = rendered.getChannelData(ch), dst = out.getChannelData(ch);
        for(var i = 0; i < loopLen; i++) dst[i] = src[i];
        for(var j = loopLen; j < src.length; j++) dst[j - loopLen] += src[j];
      }
      return out;
    });
  }

  function ensure(){
    if(ctx) return true;
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return false;
      ctx = new AC();
      /* iOS: 무음 스위치·키보드 입력·알림 때 소리가 끊기지 않도록 '재생' 모드로 설정 */
      try{ if(navigator.audioSession) navigator.audioSession.type = 'playback'; }catch(e){}
      /* 소리 장치가 잠시 멈추면(iOS 중단) 바로 다시 켬 */
      ctx.onstatechange = function(){ if(songWanted && ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume(); };
      master = ctx.createGain(); master.gain.value = on ? 1 : 0;
      master.connect(ctx.destination);
      return true;
    }catch(e){ return false; }
  }

  /* 곡 재생: 처음 한 번만 만들고, 그 다음부터는 같은 곡을 끝없이 반복 */
  function startSong(){
    if(!ensure()) return;
    if(ctx.state !== 'running') ctx.resume();
    if(songSrc || rendering) return;
    if(!songBuf){
      rendering = true;
      renderSong().then(function(b){ songBuf = b; rendering = false; if(songWanted) startSongNow(); })
        .catch(function(){ rendering = false; });
      return;
    }
    startSongNow();
  }
  function startSongNow(){
    if(songSrc || !ctx) return;
    songSrc = ctx.createBufferSource();
    songSrc.buffer = songBuf; songSrc.loop = true;
    songSrc.loopStart = 0; songSrc.loopEnd = songBuf.duration;   /* 반복 지점을 정확히 지정 (iOS에서 끝부분이 어긋나는 것 방지) */
    songSrc.connect(master); songSrc.start();
  }

  var SFX = {
    ok:      function(c, t){ tone(c, 880, t, 0.14, 'sine', 0.3); tone(c, 1320, t + 0.09, 0.22, 'sine', 0.3); },
    ng:      function(c, t){ tone(c, 330, t, 0.2, 'sawtooth', 0.16); tone(c, 220, t + 0.16, 0.3, 'sawtooth', 0.16); },
    tick:    function(c, t){ tone(c, 1000, t, 0.06, 'square', 0.08); },
    start:   function(c, t){ [523,659,784,1047].forEach(function(f,i){ tone(c, f, t + i * 0.09, 0.18, 'triangle', 0.3); }); },
    fanfare: function(c, t){ [523,659,784,1047,784,1047].forEach(function(f,i){ tone(c, f, t + i * 0.12, 0.25, 'triangle', 0.3); }); }
  };
  function tone(c, freq, when, dur, type, vol){
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + dur + 0.05);
  }
  function play(name){
    if(!on || !ensure() || !SFX[name]) return;
    if(ctx.state !== 'running') ctx.resume();
    SFX[name](ctx, ctx.currentTime + 0.01);
  }

  /* 화면이 바뀌어도 같은 곡을 그대로 이어서 재생 (곡이 바뀌지 않으니 끊길 일이 없음) */
  function scene(){
    songWanted = true;
    if(on) startSong();
  }
  function setOn(v){
    on = v; try{ localStorage.setItem(KEY, v ? 'on' : 'off'); }catch(e){}
    if(master) master.gain.value = v ? 1 : 0;
    if(v && songWanted) startSong();
    paint();
  }
  var btn = null;
  function paint(){ if(btn){ btn.textContent = on ? '🔊' : '🔇'; btn.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기'); } }
  function mountButton(){
    if(btn || !document.body) return;
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ghost'; btn.id = 'soundBtn';
    btn.style.cssText = 'position:fixed;left:10px;bottom:10px;width:44px;height:44px;border-radius:50%;padding:0;font-size:20px;z-index:80;box-shadow:0 3px 0 var(--ink);opacity:.9';
    btn.onclick = function(){ ensure(); setOn(!on); };
    document.body.appendChild(btn); paint();
  }
  /* 첫 터치/클릭 때 소리를 깨우고, 그 전에 요청된 음악을 시작 */
  function unlock(){ if(!ensure()) return; if(ctx.state !== 'running') ctx.resume(); if(on && songWanted) startSong(); }
  /* 처음부터 음악을 틀어 두고, 첫 터치 때 깨워서 시작 (입장·설정 화면 등 scene()을 안 부르는 화면도 포함) */
  songWanted = true;
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('DOMContentLoaded', mountButton);
  if(document.readyState !== 'loading') mountButton();

  window.TQSound = { scene: scene, play: play, setOn: setOn, isOn: function(){ return on; } };
})();
