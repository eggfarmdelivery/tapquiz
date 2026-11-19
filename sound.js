/* 탭퀴즈 소리 (음원 파일 없이 브라우저에서 바로 만드는 효과음 + 잔잔한 배경음)
 * TQSound.scene('lobby'|'play'|'result'|'final')  화면이 바뀔 때 배경음 전환
 * TQSound.play('ok'|'ng'|'tick'|'start'|'fanfare')  효과음 한 번
 * 브라우저 정책상 사용자가 화면을 한 번 누른 뒤에만 소리가 나요.
 */
(function(){
  'use strict';
  var KEY = 'tq_sound';
  var on = true;
  try{ on = localStorage.getItem(KEY) !== 'off'; }catch(e){}

  var ctx = null, master = null, bgmGain = null, timer = null, nextT = 0, step = 0, wantBgm = false;
  var CHORDS = [[523.25,659.25,783.99],[440,523.25,659.25],[349.23,440,523.25],[392,493.88,587.33]];

  function ensure(){
    if(ctx) return true;
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
      bgmGain = ctx.createGain(); bgmGain.gain.value = 0.05; bgmGain.connect(master);
      return true;
    }catch(e){ return false; }
  }
  function tone(freq, when, dur, type, vol, dest){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(dest || master); o.start(when); o.stop(when + dur + 0.05);
  }
  function bgmTick(){
    if(!ctx || !wantBgm) return;
    while(nextT < ctx.currentTime + 0.6){
      var chord = CHORDS[Math.floor(step / 4) % CHORDS.length];
      var f = chord[step % 3];
      tone(f, nextT, 0.22, 'triangle', 0.5, bgmGain);
      step++; nextT += 0.25;
    }
  }
  function startBgm(){
    if(!ensure()) return;
    if(ctx.state === 'suspended') ctx.resume();
    if(wantBgm) return;
    wantBgm = true; nextT = ctx.currentTime + 0.05; step = 0;
    timer = setInterval(bgmTick, 150); bgmTick();
  }
  function stopBgm(){
    wantBgm = false; if(timer){ clearInterval(timer); timer = null; }
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
  var pendingBgm = false;   /* 배경음을 원하는 화면인지 (첫 터치 전이면 기다렸다가 시작) */
  function scene(name){
    if(name === 'play' || name === 'result' || name === 'final'){ pendingBgm = false; stopBgm(); }
    else { pendingBgm = true; if(on) startBgm(); }
  }
  function setOn(v){
    on = v; try{ localStorage.setItem(KEY, v ? 'on' : 'off'); }catch(e){}
    if(master) master.gain.value = v ? 1 : 0;
    if(v) startBgm(); else stopBgm();
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
  /* 첫 터치/클릭 때 소리를 깨우고, 그 전에 요청된 배경음을 시작 */
  function unlock(){ if(!ensure()) return; if(ctx.state === 'suspended') ctx.resume(); if(on && !wantBgm && pendingBgm) startBgm(); }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('DOMContentLoaded', mountButton);
  if(document.readyState !== 'loading') mountButton();

  window.TQSound = { scene: scene, play: play, setOn: setOn, isOn: function(){ return on; } };
})();
