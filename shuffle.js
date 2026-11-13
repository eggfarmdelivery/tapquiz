/* 떡먹은 탭탭이 → "간식 먹은 탭탭이 찾기" 공용 애니메이션 (host/player/demo 공용)
 * 같은 시퀀스(seq)와 같은 시작 시각(readyUntil)만 있으면 어느 기기에서나 똑같이 움직여요.
 */
(function(){
  var FOODS = ['🍗','🍩','🍔','🍉','🍕','🍦','🍰','🍙'];
  var CHAR = ['3,0','3,0','3,0','3,0'];            // 탭탭이 4마리는 완전히 똑같이 생겼어요
  var PAIRS = [[0,1],[1,2],[2,3],[0,3]];            // 옆자리끼리, 또는 맨 왼쪽↔맨 오른쪽
  var INTRO = 3000;                                 // 줄서기 + 간식 먹는 장면(ms)

  function make(o){
    var swaps = o.swaps || 6, step = o.stepMs || 600, moves = [], last = -1;
    for (var i=0;i<swaps;i++){ var k; do{ k = Math.floor(Math.random()*PAIRS.length); }while(k===last); last = k; moves.push(PAIRS[k]); }
    return { food: FOODS[Math.floor(Math.random()*FOODS.length)], eater: Math.floor(Math.random()*4),
             moves: moves, stepMs: step, introMs: INTRO };
  }
  function slots(seq, n){            // n번 움직인 뒤 slots[캐릭터] = 자리
    var pos = [0,1,2,3];
    for (var i=0;i<n;i++){ var m = seq.moves[i]; for (var c=0;c<4;c++){ if(pos[c]===m[0]) pos[c]=m[1]; else if(pos[c]===m[1]) pos[c]=m[0]; } }
    return pos;
  }
  function finalPos(seq){ return slots(seq, seq.moves.length)[seq.eater]; }
  function totalMs(seq){ return seq.introMs + seq.moves.length*seq.stepMs; }
  function ease(p){ return p<.5 ? 2*p*p : 1-2*(1-p)*(1-p); }

  function build(el){
    var h = '';
    for (var c=0;c<4;c++) h += '<div class="shc" data-c="'+c+'" style="position:absolute;width:23%;will-change:left,top;cursor:default">'+Jelly.svg(CHAR[c])+'</div>';
    h += '<div class="shfood" style="position:absolute;line-height:1;display:none"></div>';
    for (var s=0;s<4;s++) h += '<div class="shno" data-s="'+s+'" style="position:absolute;display:none;text-align:center;font-weight:800;border-radius:999px;background:#2A2550;color:#FFC24B"></div>';
    el.innerHTML = h;
    el.style.position = 'relative';
  }

  /* opts: {final:true → 정지 상태로 정답 공개, onPick(slot) → 정지 후 누를 수 있음, onPhase(name)} */
  function mount(el, seq, startAt, opts){
    opts = opts || {};
    build(el);
    var W = el.clientWidth || 600, fs = W*0.085;
    el.style.fontSize = fs+'px';
    var chars = el.querySelectorAll('.shc'), food = el.querySelector('.shfood'), nos = el.querySelectorAll('.shno');
    var phaseSeen = '', raf = 0, stopped = false;
    var H = el.clientHeight || W/2, chP = (W*0.23*63/52)/H*100, fsP = fs/H*100;
    var BASE = Math.max(14, (100-chP-fsP*1.1)/2 + fsP*0.5), ARC = Math.min(24, BASE*0.85);   // 줄 높이(%) / 위아래로 움직이는 폭(%)
    function place(c, slot, dy){ chars[c].style.left = ((slot+.5)*25-11.5)+'%'; chars[c].style.top = (BASE+dy)+'%'; }
    function layout(now){
      var t = now - startAt, pos, phase, dy = [0,0,0,0];
      var intro = seq.introMs, step = seq.stepMs, n = seq.moves.length, end = intro + n*step;
      if (opts.final){ pos = slots(seq, n); phase = 'final'; }
      else if (t < 0){ pos = slots(seq,0); phase = 'ready'; }
      else if (t < intro){ pos = slots(seq,0); phase = 'intro'; }
      else if (t < end){
        var k = Math.floor((t-intro)/step), p = ease(((t-intro)-k*step)/step);
        var a = slots(seq,k), b = slots(seq,k+1);
        pos = [0,0,0,0];
        for (var c=0;c<4;c++){ pos[c] = a[c] + (b[c]-a[c])*p; if (a[c]!==b[c]) dy[c] = Math.sin(p*Math.PI) * (c%2? -ARC : ARC) * (a[c]<b[c] ? 1 : -1); }
        phase = 'shuffle';
      } else { pos = slots(seq,n); phase = 'stop'; }
      for (var c2=0;c2<4;c2++){
        var x = pos[c2];
        chars[c2].style.left = ((x+.5)*25-11.5)+'%';
        chars[c2].style.top = (BASE+dy[c2])+'%';
        chars[c2].style.zIndex = dy[c2]>0 ? 3 : 2;
      }
      // 간식: 줄서기 장면에서 위에서 떨어져 먹는 탭탭이 위에 잠깐 보였다가 사라져요
      var showFood = false, fy = 0, fx = (seq.eater+.5)*25;
      if (opts.final){ showFood = true; fx = (pos[seq.eater]+.5)*25; fy = BASE-fsP-1; }
      else if (phase==='intro'){
        if (t>=500 && t<1300){ showFood = true; fy = -30 + (BASE-fsP-1+30)*ease((t-500)/800); }
        else if (t>=1300 && t<2000){ showFood = true; fy = BASE-fsP-1; }
      }
      food.style.display = showFood ? 'block' : 'none';
      if (showFood){ food.textContent = seq.food; food.style.left = 'calc('+fx+'% - '+(fs/2)+'px)'; food.style.top = fy+'%'; }
      // 먹는 탭탭이는 냠냠 살짝 커졌다 작아져요
      for (var e=0;e<4;e++){ chars[e].style.transform = (phase==='intro' && e===seq.eater && t>=1300 && t<2000) ? 'scale('+(1+0.12*Math.sin((t-1300)/700*Math.PI*3))+')' : ''; }
      // 멈춘 뒤엔 자리 번호
      var showNo = (phase==='stop' || phase==='final');
      for (var s=0;s<4;s++){ var d = nos[s].style; d.display = showNo ? 'block' : 'none'; if(showNo){ nos[s].textContent = (s+1); d.left = 'calc('+((s+.5)*25)+'% - '+(fs*0.45)+'px)'; d.top = (BASE+chP+1)+'%'; d.width = (fs*0.9)+'px'; d.height = (fs*0.9)+'px'; d.lineHeight = (fs*0.9)+'px'; d.fontSize = (fs*0.55)+'px'; } }
      if (phase!==phaseSeen){ phaseSeen = phase; if (opts.onPhase) opts.onPhase(phase, t); }
      for (var q=0;q<4;q++) chars[q].style.cursor = (phase==='stop' && opts.onPick) ? 'pointer' : 'default';
    }
    var phaseNow = function(){ return phaseSeen; };
    function loop(){ if(stopped) return; layout(Date.now()); if (!opts.final) raf = requestAnimationFrame(loop); }
    // 캐릭터/번호를 누르면 "그 자리"를 골라요 (정지 상태에서만)
    el.addEventListener('pointerdown', function(ev){
      if (phaseSeen!=='stop' || !opts.onPick) return;
      var node = ev.target.closest ? ev.target.closest('.shc,.shno') : null; if(!node) return;
      var slot;
      if (node.classList.contains('shno')) slot = +node.getAttribute('data-s');
      else { var pos = slots(seq, seq.moves.length); slot = pos[+node.getAttribute('data-c')]; }
      opts.onPick(slot);
    });
    loop();
    return { stop: function(){ stopped = true; cancelAnimationFrame(raf); }, phase: phaseNow };
  }
  window.TQShuffle = { make: make, finalPos: finalPos, totalMs: totalMs, mount: mount, FOODS: FOODS, CHAR: CHAR };
})();

/* 다른 탭탭이 찾기: 같은 탭탭이 여러 마리 중 하나만 다른 모습 (공용 렌더링) */
(function(){
  function shift(hex, dh, dl){
    var r=parseInt(hex.substr(1,2),16)/255,g=parseInt(hex.substr(3,2),16)/255,b=parseInt(hex.substr(5,2),16)/255;
    var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;
    if(d){ s=l>.5?d/(2-mx-mn):d/(mx+mn); h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; }
    h=(h+dh+360)%360; l=Math.max(0,Math.min(1,l+dl/100));
    function f(n){ var k=(n+h/30)%12, a=s*Math.min(l,1-l); var v=l-a*Math.max(-1,Math.min(k-3,9-k,1)); return ('0'+Math.round(v*255).toString(16)).slice(-2); }
    return '#'+f(0)+f(8)+f(4);
  }
  function cell(seq, odd){
    var m = Jelly.svg(odd ? seq.odd : seq.base);
    if (odd && seq.oddColor) m = m.split(Jelly.COLORS[+seq.base.split(',')[0]]).join(seq.oddColor);
    return m;
  }
  function make(o){
    var c = Math.floor(Math.random()*8), a = Math.floor(Math.random()*6), cols = o.cols || 3;
    var seq = { base:c+','+a, cols:cols, oddIdx:Math.floor(Math.random()*cols*cols) };
    if (o.mode==='color'){            // 같은 탭탭이인데 색만 아주 조금 다르게 (색상을 살짝 돌리고 밝기를 살짝 낮춰요)
      seq.odd = seq.base; seq.oddColor = shift(Jelly.COLORS[c], (Math.random()<.5?1:-1)*(o.shift||9), -3);
    } else seq.odd = c+','+((a+2+Math.floor(Math.random()*2)*2)%6);
    return seq;
  }
  function mount(el, seq, startAt, opts){
    opts = opts || {}; var stopped = false, shown = '', n = seq.cols*seq.cols;
    el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
    function grid(){
      var h = '<div style="height:100%;max-width:100%;aspect-ratio:1;display:grid;grid-template-columns:repeat('+seq.cols+',1fr);gap:'+(seq.cols>4?5:8)+'px;padding:8px;box-sizing:border-box">';
      for (var i=0;i<n;i++) h += '<div class="dfc" data-i="'+i+'" style="background:#2A2550;border-radius:12px;display:flex;align-items:flex-end;justify-content:center;padding:4%;min-width:0;min-height:0;'+(opts.final && i===seq.oddIdx ? 'outline:4px solid #FFC24B;outline-offset:-4px;' : '')+'"><div style="width:84%">'+cell(seq, i===seq.oddIdx)+'</div></div>';
      return h + '</div>';
    }
    function layout(){
      var left = startAt - Date.now(), key = (opts.final || left<=0) ? 'grid' : 'c'+Math.ceil(left/1000);
      if (key===shown) return; shown = key;
      if (key==='grid'){ el.innerHTML = grid(); if (opts.onPhase) opts.onPhase('go'); }
      else { el.innerHTML = '<div style="font-family:var(--display,inherit);font-size:'+Math.round(Math.min(el.clientHeight,el.clientWidth)*0.5)+'px;color:#FFC24B;line-height:1">'+Math.ceil(left/1000)+'</div>'; if (opts.onPhase) opts.onPhase('ready'); }
    }
    el.addEventListener('pointerdown', function(ev){
      if (shown!=='grid' || !opts.onPick) return;
      var c = ev.target.closest ? ev.target.closest('.dfc') : null; if (c) opts.onPick(+c.getAttribute('data-i'));
    });
    var t = setInterval(function(){ if(stopped){ clearInterval(t); return; } layout(); }, 50); layout();
    return { stop:function(){ stopped = true; clearInterval(t); } };
  }
  window.TQDiff = { make: make, mount: mount, cell: cell };
})();
