/* 탭퀴즈 소리 (음원 파일 없이 브라우저에서 바로 만드는 배경음악 + 효과음)
 * TQSound.scene('lobby'|'play'|'result'|'final')  화면에 맞는 배경음으로 바꿈 (게임 중에도 계속 나옴)
 * TQSound.play('ok'|'ng'|'tick'|'start'|'fanfare')  효과음 한 번
 * 브라우저 정책상 사용자가 화면을 한 번 누른 뒤에만 소리가 나요.
 */
(function(){
  'use strict';
  var KEY = 'tq_sound';
  var on = true;
  try{ on = localStorage.getItem(KEY) !== 'off'; }catch(e){}

  var ctx = null, master = null, bus = null, timer = null;
  /* 곡마다 새 연결(bus)을 만들어서, 곡이 바뀌면 이전 곡의 예약된 음을 바로 끊을 수 있게 함 */
  function newBus(){
    var g = ctx.createGain(); g.gain.value = 0.22; g.connect(master); return g;
  }
  var nextT = 0, step = 0, loopNo = 0, wantMusic = false, pendingMusic = false;
  var cfg = null;

  /* 화면별 곡 설정: 빠르기(bpm), 코드 진행(루트 MIDI), 드럼 여부 */
  var SCENES = {
    lobby:  { bpm:116, chords:[48,45,41,43], hat:false, name:'lobby' },   /* C-Am-F-G, 밝고 가볍게 */
    play:   { bpm:150, chords:[45,41,48,43], hat:true,  name:'play' },    /* Am-F-C-G, 신나게 */
    result: { bpm:132, chords:[48,43,45,41], hat:false, name:'result' },  /* C-G-Am-F */
    final:  { bpm:126, chords:[41,48,43,48], hat:true,  name:'final' }    /* F-C-G-C, 축하 분위기 */
  };
  /* 멜로디 패턴 (C 펜타토닉 음계의 인덱스). 두 가지를 번갈아 써서 단조롭지 않게 */
  var MOTIF_A = [0,2,4,2, 3,4,2,0];
  var MOTIF_B = [4,3,2,4, 5,4,2,1];
  var MOTIF_C = [2,4,5,4, 6,5,4,2];
  var PENTA = [0,2,4,7,9];
  function mf(m){ return 440 * Math.pow(2, (m - 69) / 12); }
  function lead(i){ return 72 + 12 * Math.floor(i / 5) + PENTA[i % 5]; }

  function ensure(){
    if(ctx) return true;
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
      bus = newBus();
      return true;
    }catch(e){ return false; }
  }
  function tone(freq, when, dur, type, vol, dest){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(dest || master); o.start(when); o.stop(when + dur + 0.05);
  }
  function hat(when){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(7200, when);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.035, when + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    o.connect(g); g.connect(bus); o.start(when); o.stop(when + 0.06);
  }

  /* 한 칸(8분음표)씩 미리 예약해서 끊김 없이 재생 */
  function musicTick(){
    if(!ctx || !wantMusic || !cfg) return;
    var eighth = 60 / cfg.bpm / 2;
    while(nextT < ctx.currentTime + 0.6){
      var k = step % 8, chordIdx = Math.floor(step / 8) % cfg.chords.length;
      var root = cfg.chords[chordIdx];
      var motif = (loopNo + chordIdx) % 2 ? MOTIF_B : MOTIF_A;
      if(loopNo % 4 === 3) motif = MOTIF_C;
      /* 베이스: 1박과 3박 */
      if(k === 0 || k === 4) tone(mf(root), nextT, eighth * 1.8, 'triangle', 0.5, bus);
      if(k === 2 || k === 6) tone(mf(root + 7), nextT, eighth * 1.2, 'triangle', 0.22, bus);
      /* 멜로디 */
      tone(mf(lead(motif[k])), nextT, eighth * 0.9, 'sine', 0.28, bus);
      /* 드럼 느낌 (신나는 곡만) */
      if(cfg.hat && k % 2 === 1) hat(nextT);
      step++; nextT += eighth;
      if(step % 32 === 0) loopNo++;
    }
  }
  function startMusic(){
    if(!ensure()) return;
    if(ctx.state === 'suspended') ctx.resume();
    if(wantMusic) return;
    wantMusic = true; nextT = ctx.currentTime + 0.05;
    timer = setInterval(musicTick, 120); musicTick();
  }
  function stopMusic(){
    wantMusic = false; if(timer){ clearInterval(timer); timer = null; }
  }

  var SFX = {
    ok:      function(t){ tone(880, t, 0.14, 'sine', 0.3); tone(1320, t+0.09, 0.22, 'sine', 0.3); },
    ng:      function(t){ tone(330, t, 0.2, 'sawtooth', 0.16); tone(220, t+0.16, 0.3, 'sawtooth', 0.16); },
    tick:    function(t){ tone(1000, t, 0.06, 'square', 0.08); },
    start:   function(t){ [523,659,784,1047].forEach(function(f,i){ tone(f, t+i*0.09, 0.18, 'triangle', 0.3); }); },
    fanfare: function(t){ [523,659,784,1047,784,1047].forEach(function(f,i){ tone(f, t+i*0.12, 0.25, 'triangle', 0.3); }); }
  };
  function play(name){
    if(!on || !ensure() || !SFX[name]) return;
    if(ctx.state === 'suspended') ctx.resume();
    SFX[name](ctx.currentTime + 0.01);
  }

  /* 화면이 바뀌면 곡만 바꾸고 재생은 계속 (게임 중에도 음악이 나옴) */
  function scene(name){
    var next = SCENES[name] || SCENES.lobby;
    if(cfg !== next){
      cfg = next; loopNo = 0; step = 0;
      if(ctx){
        /* 이전 곡은 즉시 소리를 끄고(예약된 음 포함), 새 곡은 새 연결에서 시작 */
        var old = bus, now = ctx.currentTime;
        if(old){ old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0, now + 0.05); setTimeout(function(){ try{ old.disconnect(); }catch(e){} }, 300); }
        bus = newBus();
        nextT = now + 0.08;
      }
    }
    pendingMusic = true;
    if(on) startMusic();
  }
  function setOn(v){
    on = v; try{ localStorage.setItem(KEY, v ? 'on' : 'off'); }catch(e){}
    if(master) master.gain.value = v ? 1 : 0;
    if(v){ if(pendingMusic) startMusic(); } else { stopMusic(); }
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
  function unlock(){ if(!ensure()) return; if(ctx.state === 'suspended') ctx.resume(); if(on && pendingMusic && !wantMusic) startMusic(); }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('DOMContentLoaded', mountButton);
  if(document.readyState !== 'loading') mountButton();

  window.TQSound = { scene: scene, play: play, setOn: setOn, isOn: function(){ return on; } };
})();
