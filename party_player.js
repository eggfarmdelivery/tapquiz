/* 분위기형 게임 - 참가자 휴대폰 쪽 화면 */
(function(){
  'use strict';
  var P = window.TQParty, esc = P.esc;
  var R = P.phone;
  function center(ctx, inner, jump){ ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center">'+inner+'</div>'; }
  function me(ctx, w, cls){ return '<div class="'+(cls||'m-bounce')+'">'+ctx.avHTML(ctx.S.me.avatar, ctx.S.me.team, w||120)+'</div>'; }
  function waiting(ctx, msg, sub){ center(ctx, '<div class="big">'+esc(msg)+'</div>'+me(ctx,120,'m-sway')+(sub?'<div class="muted">'+sub+'</div>':'')); }
  function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms||40); }catch(e){} }
  function name(ctx, id){ var p = (ctx.players()||[]).filter(function(x){ return x.id===id; })[0]; return p ? p.nickname : ''; }

  R.raffle = function(ctx, st){
    if(!st || st.phase==='roll') return center(ctx, '<div class="big">추첨 중…</div>'+me(ctx,130,'m-jump')+'<div class="muted">'+(st&&st.prize?esc(st.prize)+' 추첨이에요!':'큰 화면을 보세요!')+'</div>');
    if(st.phase==='win'){ var mine = st.pid===ctx.S.me.id; if(mine) buzz([80,60,160]);
      return center(ctx, mine ? '<div class="big pop" style="font-size:46px;color:var(--coral)">🎉 당첨!</div>'+me(ctx,150,'m-jump')+'<div class="box pop" style="padding:14px 20px;font-family:var(--display);font-size:30px;background:var(--gold)">'+esc(st.prize)+'</div><div class="muted">방장에게 화면을 보여주세요!</div>'
        : '<div class="big">축하해요!</div><div class="pts" style="font-size:34px;color:var(--ink)">'+esc(st.name)+'</div><div class="muted">'+esc(st.prize)+' 당첨</div>'); }
    waiting(ctx, '추첨이 끝났어요', '큰 화면에서 당첨자를 확인하세요');
  };
  R.wheel = function(ctx, st){
    if(!st || st.phase==='spin') return center(ctx, '<div class="big">돌림판이 돌아가요!</div><div style="font-size:90px" class="m-sway">🎡</div><div class="muted">큰 화면을 보세요</div>');
    if(st.phase==='result'){
      if(st.winner){ var mine = st.winner===ctx.S.me.id; if(mine) buzz([80,60,160]);
        return center(ctx, mine ? '<div class="big pop" style="font-size:48px;color:var(--coral)">🎉 당첨!</div>'+me(ctx,150,'m-jump')+'<div class="muted">내가 뽑혔어요!</div>'
          : '<div class="muted">뽑힌 사람은</div><div class="m-bounce" style="width:130px">'+ctx.avHTML(st.avatar, st.team, 130)+'</div><div class="big pop" style="font-size:40px;color:var(--coral)">'+esc(st.text)+'</div>'); }
      return center(ctx, '<div class="muted">결과</div><div class="big pop" style="font-size:44px;color:var(--coral)">'+esc(st.text)+'</div><div style="font-size:70px">🎉</div>'); }
    waiting(ctx, '돌림판 끝!', '');
  };
  R.order = function(ctx, st){
    if(!st || st.phase!=='order') return waiting(ctx, '순서를 뽑는 중…', '큰 화면을 보세요');
    var i = st.ord.indexOf(ctx.S.me.id); center(ctx, '<div class="muted">내 순서</div><div class="pts pop" style="font-size:110px;color:var(--coral)">'+(i+1)+'번</div>'+me(ctx,110)+'<div class="muted">전체 '+st.ord.length+'명</div>');
  };
  R.ladder = function(ctx, st){
    var S = ctx.S, myId = S.me.id;
    if(!st) return waiting(ctx, '곧 시작해요', '방장이 준비 중이에요');
    if(st.phase==='pick'){
      var taken = st.taken||{}, mineK = null; Object.keys(taken).forEach(function(k){ if(taken[k]===myId) mineK = +k; });
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center" style="justify-content:flex-start;gap:12px"><div class="big" style="font-size:26px">사다리 줄을 골라요</div><div class="muted">'+(mineK!=null?'내 줄: '+(mineK+1)+'번 ✅ (바꿀 수도 있어요)':'원하는 번호를 눌러요')+'</div>'
        +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%">'+Array.apply(null,Array(st.n)).map(function(_,k){ var tk = taken[k] && taken[k]!==myId, on = taken[k]===myId;
          return '<button class="lpick" data-k="'+k+'" '+(tk?'disabled':'')+' style="height:64px;font-size:26px;font-family:var(--display);border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);background:'+(on?'var(--mint)':tk?'#ddd':'#fff')+'">'+(k+1)+'</button>'; }).join('')+'</div></div>';
      ctx.app.querySelectorAll('.lpick').forEach(function(b){ b.onclick = function(){ ctx.send({ pick:+b.dataset.k }); buzz(20); }; });
      return;
    }
    var res = st.res && st.res[myId];
    if(st.phase==='run' && !res) return waiting(ctx, '사다리 타는 중…', '큰 화면을 보세요!');
    if(res) return center(ctx, '<div class="muted">내 결과</div><div class="big pop" style="font-size:44px;color:var(--coral)">'+esc(res)+'</div>'+me(ctx,120));
    waiting(ctx, '사다리 끝!', '');
  };

  R.liar = function(ctx, st){
    var S = ctx.S, myId = S.me.id;
    if(!st) return waiting(ctx, '곧 시작해요', '방장이 준비 중이에요');
    var isLiar = (st.liars||[]).indexOf(myId)>=0;
    if(st.phase==='role'){
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center"><div class="big" style="font-size:26px">내 카드</div><div class="muted">카드를 꾹 누르고 있는 동안만 보여요<br>(옆 사람이 못 보게 조심!)</div>'
        +'<div id="lcard" style="width:100%;max-width:340px;height:260px;border-radius:22px;border:4px solid var(--ink);box-shadow:6px 6px 0 var(--ink);background:var(--coral);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:38px;user-select:none;-webkit-user-select:none;touch-action:none;text-align:center;padding:14px">👆 꾹 눌러서 확인</div>'
        +'<div class="muted">카테고리: <b>'+esc(st.catKo)+'</b></div></div>';
      var card = ctx.app.querySelector('#lcard');
      var showIt = function(){ card.style.background = isLiar ? '#1B1530' : '#fff'; card.style.color = isLiar ? '#FF5D8F' : '#1B1530';
        card.innerHTML = isLiar ? '<div>🤥 당신은<br>라이어!<div style="font-size:20px;margin-top:10px;font-family:var(--font)">카테고리 \''+esc(st.catKo)+'\'만 알아요.<br>눈치껏 아는 척하세요!</div></div>' : '<div><div style="font-size:18px;font-family:var(--font);color:#777">제시어</div>'+esc(st.word)+'</div>'; };
      var hideIt = function(){ card.style.background = 'var(--coral)'; card.style.color = '#fff'; card.textContent = '👆 꾹 눌러서 확인'; };
      card.addEventListener('pointerdown', function(e){ e.preventDefault(); showIt(); }); ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ card.addEventListener(ev, hideIt); });
      card.addEventListener('contextmenu', function(e){ e.preventDefault(); });
      return;
    }
    if(st.phase==='vote'){
      var others = (ctx.players()||[]).filter(function(p){ return p.id!==myId; });
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center" style="justify-content:flex-start"><div class="big" style="font-size:26px">라이어는 누구?</div><div class="muted">한 명을 눌러 투표해요</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%">'+others.map(function(p){ return '<button class="vb" data-id="'+p.id+'" style="height:auto;padding:10px;flex-direction:column;display:flex;align-items:center;gap:4px;background:#fff;border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink)"><span style="width:60px;display:block">'+Jelly.svg(p.avatar,p.team)+'</span><span style="font-size:15px">'+esc(p.nickname)+'</span></button>'; }).join('')+'</div></div>';
      ctx.app.querySelectorAll('.vb').forEach(function(b){ b.onclick = function(){ ctx.send({ vote:b.dataset.id }); ctx.app.querySelectorAll('.vb').forEach(function(x){ x.style.background = x===b?'var(--mint)':'#eee'; x.disabled = true; }); buzz(30); toast2(ctx,'투표 완료!'); }; });
      return;
    }
    if(st.phase==='guess'){
      if(isLiar){ ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center"><div class="big">들켰어요!</div><div class="muted">하지만 제시어를 맞히면 역전승!<br>카테고리: '+esc(st.catKo)+'</div><form id="gf" style="display:flex;flex-direction:column;gap:10px;width:100%"><input id="gv" type="text" placeholder="제시어를 써 보세요" style="height:60px;font-size:22px;text-align:center" autocomplete="off"><button style="height:56px">제출</button></form></div>';
        ctx.app.querySelector('#gf').onsubmit = function(e){ e.preventDefault(); var v = ctx.app.querySelector('#gv').value.trim(); if(v){ ctx.send({ guess:v }); center(ctx,'<div class="big">제출했어요!</div><div class="muted">결과를 기다려요</div>'); } }; return; }
      return waiting(ctx, '라이어가 잡혔어요!', '라이어가 제시어를 맞힐 수 있을까요?');
    }
    if(st.phase==='reveal'){
      var iWin = isLiar ? st.liarsWin : !st.liarsWin; if(iWin) buzz([60,40,120]);
      return center(ctx, '<div class="big pop" style="color:'+(iWin?'var(--mint)':'var(--ink)')+'">'+(iWin?'🎉 승리!':'아쉬워요')+'</div>'+me(ctx,120,iWin?'m-jump':'m-sway')+'<div class="muted">제시어는 <b>'+esc(st.word)+'</b>이었어요<br>'+(isLiar?'내가 라이어였어요 🤥':'')+'</div>');
    }
    waiting(ctx, '진행 중…', '');
  };
  function toast2(ctx, m){ var t = document.createElement('div'); t.className='toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 1600); }

  R.rps = function(ctx, st){
    var myId = ctx.S.me.id;
    if(!st) return waiting(ctx, '곧 시작해요', '컴퓨터를 이겨라!');
    var alive = (st.alive||[]).indexOf(myId)>=0;
    if(st.phase==='pick'){
      if(!alive) return waiting(ctx, '탈락했어요 😢', '끝까지 응원해 주세요!');
      var left = Math.max(0, st.at + st.sec*1000 - Date.now());
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center" style="gap:14px"><div class="big" style="font-size:26px">'+(st.tag==='final'?'🏆 결승! 이겨요!':'컴퓨터를 이겨요!')+'</div><div class="muted">'+st.round+'라운드 · 시간 안에 골라요</div><div id="rt" class="pts" style="color:var(--coral);font-size:60px"></div>'
        +'<div style="display:grid;grid-template-columns:1fr;gap:12px;width:100%">'+['rock','scissors','paper'].map(function(h){ return '<button class="hb" data-h="'+h+'" style="height:84px;font-size:34px;background:#fff;border:3px solid var(--ink);box-shadow:0 5px 0 var(--ink)">'+P.HAND[h]+' '+P.HAND_KO[h]+'</button>'; }).join('')+'</div></div>';
      var cdEl = ctx.app.querySelector('#rt'), t0 = Date.now()+left; clearInterval(ctx.S.rxTimer);
      ctx.S.rxTimer = setInterval(function(){ var l = Math.max(0, Math.ceil((t0-Date.now())/1000)); if(cdEl) cdEl.textContent = l; if(l<=0) clearInterval(ctx.S.rxTimer); }, 200);
      ctx.app.querySelectorAll('.hb').forEach(function(b){ b.onclick = function(){ ctx.send({ round:st.round, tag:st.tag, pick:b.dataset.h }); ctx.app.querySelectorAll('.hb').forEach(function(x){ x.disabled = true; x.style.opacity = x===b?1:.35; }); buzz(30); }; });
      return;
    }
    if(st.phase==='reveal'){ var pk = st.picks && st.picks[myId], ok = (st.surv||[]).indexOf(myId)>=0;
      if(!alive) return waiting(ctx, '탈락 중…', '컴퓨터는 '+P.HAND[st.comp]+' '+P.HAND_KO[st.comp]);
      if(ok) buzz([50,40,90]);
      return center(ctx, '<div class="muted">컴퓨터 '+P.HAND[st.comp]+' vs 나 '+(pk?P.HAND[pk]:'🚫')+'</div><div class="big pop" style="color:'+(ok?'var(--mint)':'var(--coral)')+'">'+(ok?'생존! 🎉':(pk?'탈락!':'안 냈어요'))+'</div>'+me(ctx,120,ok?'m-jump':'m-sway')+'<div class="muted">'+(ok?'다음 라운드를 기다려요':'아쉬워요')+'</div>'); }
    if(st.phase==='duel'){ var isMe = st.a===myId || st.b===myId, iw = st.win===myId;
      return center(ctx, '<div class="muted">'+(isMe?'결승 결과':'결승전 구경 중')+'</div><div class="big pop" style="color:'+(iw?'var(--mint)':'var(--ink)')+'">'+(st.win ? (iw?'우승! 🏆':(isMe?'아쉬워요':'결승 끝!')) : '비겼어요! 다시!')+'</div>'+me(ctx,110, iw?'m-jump':'m-sway')); }
    if(st.phase==='end'){ var w = st.champ===myId; return center(ctx, '<div class="big pop">'+(w?'🏆 최후의 1인!':'게임 끝!')+'</div>'+me(ctx,130,w?'m-jump':'m-sway')); }
    waiting(ctx, '진행 중…', '');
  };

  R.bomb = function(ctx, st){
    var myId = ctx.S.me.id; clearInterval(ctx.S.rxTimer);
    if(!st) return waiting(ctx, '곧 시작해요', '폭탄이 도착할 거예요 💣');
    if(st.phase==='bomb'){
      var holder = st.holder===myId, circle = st.circle||[], idx = circle.indexOf(st.holder), nxt = circle[(idx+1)%circle.length];
      if(!holder) return center(ctx, '<div style="font-size:90px" class="m-sway">💣</div><div class="big" style="font-size:28px">'+esc(name(ctx, st.holder))+'에게 있어요</div><div class="muted">다음은 '+esc(name(ctx,nxt))+'</div>'+me(ctx,90,'m-sway'));
      buzz([60,40,60]);
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center" style="gap:12px;flex-grow:1"><div class="big" style="font-size:26px;color:var(--coral)">폭탄이 왔어요!</div><button id="bpass" style="width:100%;flex-grow:1;min-height:300px;font-size:54px;font-family:var(--display);background:var(--coral);color:#fff;border:4px solid var(--ink);box-shadow:0 8px 0 var(--ink);border-radius:28px">💣<br>넘기기!</button><div class="muted">'+esc(name(ctx,nxt))+'에게 넘겨요 (3초 안에!)</div></div>';
      var b = ctx.app.querySelector('#bpass'), t0 = Date.now(), sent = false;
      var go = function(e){ if(e) e.preventDefault(); if(sent) return; sent = true; buzz(30); ctx.send({ pass:st.seq }); b.disabled = true; b.style.opacity = .5; b.innerHTML = '✅<br>넘겼어요'; };
      b.addEventListener('pointerdown', go);
      ctx.S.rxTimer = setInterval(function(){ var el = Date.now()-t0; if(el>2000 && !sent){ b.style.background = Math.floor(el/150)%2 ? '#fff' : 'var(--coral)'; b.style.color = Math.floor(el/150)%2 ? 'var(--coral)' : '#fff'; } if(el>3300) clearInterval(ctx.S.rxTimer); }, 100);
      return;
    }
    if(st.phase==='boom'){ var lose = st.loser===myId; if(lose) buzz([300,80,300]);
      return center(ctx, '<div class="pop" style="font-size:110px">💥</div><div class="big" style="color:'+(lose?'var(--coral)':'var(--mint)')+'">'+(lose?'펑! 벌칙 당첨 😱':'휴~ 살았다!')+'</div>'+me(ctx,110,lose?'m-sway':'m-jump')+'<div class="muted">'+(lose?'':esc(name(ctx,st.loser))+' 님이 걸렸어요')+'</div>'); }
    waiting(ctx, '게임 끝!', '');
  };

  /* ───── 도형 그리기 (캔버스) ───── */
  function turnOf(pts){ var cx=0, cy=0; pts.forEach(function(q){ cx+=q[0]; cy+=q[1]; }); cx/=pts.length; cy/=pts.length; var tot=0, prev=null;
    pts.forEach(function(q){ var a = Math.atan2(q[1]-cy, q[0]-cx); if(prev!==null){ var d = a-prev; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; tot += d; } prev = a; }); return Math.abs(tot); }
  R.draw = function(ctx, st){
    var S = ctx.S;
    if(!st) return waiting(ctx, '곧 시작해요', '손가락으로 도형을 그려요 ✏️');
    if(st.phase==='draw'){
      var KO = { circle:'동그라미', triangle:'삼각형', heart:'하트' }, end = st.at + st.sec*1000;
      var hostLag = Date.now()-(st.at-3500); if(hostLag<-2000 || hostLag>9000){ var shift = Date.now()-(st.at-3500)-1000; st.at += 0; }
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="rx" style="gap:8px"><div class="rx-top"><span id="dtop"></span></div>'
        +'<div style="position:relative;width:100%;aspect-ratio:1/1"><canvas id="dcv" width="1000" height="1000" style="width:100%;height:100%;border-radius:20px;border:4px solid var(--ink);background:#fff;touch-action:none;box-shadow:5px 5px 0 var(--ink)"></canvas>'
        +'<svg viewBox="0 0 100 100" style="position:absolute;right:8px;top:8px;width:64px;height:64px;background:#fff9;border-radius:10px;border:2px solid var(--ink);pointer-events:none"><path d="'+P.pathOf(st.shape,100)+'" fill="none" stroke="#1B1530" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round"/></svg>'
        +'<div id="dmsg" style="position:absolute;left:0;right:0;bottom:12px;text-align:center;font-weight:800;font-size:18px;color:#1B1530;pointer-events:none"></div><div id="dgo" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:110px;color:var(--coral);background:#fffc;border-radius:20px"></div></div>'
        +'<div style="display:flex;gap:10px"><button id="dredo" class="ghost" style="flex:1;height:54px;border:3px solid var(--ink)">↺ 다시 그리기</button><button id="dsubmit" style="flex:1;height:54px;border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink)">제출하기</button></div></div>';
      var cv = ctx.app.querySelector('#dcv'), c = cv.getContext('2d'), pts = [], drawing = false, closed = false, last = null, submitted = false, finished = false;
      var top = ctx.app.querySelector('#dtop'), goEl = ctx.app.querySelector('#dgo'), msg = ctx.app.querySelector('#dmsg');
      function redraw(){ c.clearRect(0,0,1000,1000); if(pts.length){ c.lineWidth = 14; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#FF5D8F'; c.beginPath(); pts.forEach(function(q,i){ if(q===null){ return; } var pv = pts[i-1]; if(i===0 || pv===null) c.moveTo(q[0],q[1]); else c.lineTo(q[0],q[1]); }); c.stroke();
        var f = pts[0]; c.beginPath(); c.arc(f[0],f[1],22,0,7); c.fillStyle = '#1FA95B'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#1B1530'; c.stroke(); } }
      function flat(){ return pts.filter(function(q){ return q; }); }
      function sample(){ var a = flat(), out = [], step = Math.max(1, Math.ceil(a.length/160)); for(var i=0;i<a.length;i+=step) out.push([Math.round(a[i][0]), Math.round(a[i][1])]); if(a.length) out.push([Math.round(a[a.length-1][0]), Math.round(a[a.length-1][1])]); return out; }
      function sendNow(){ var s = sample(); if(s.length>=8){ ctx.send({ pts:s, fin:true }); submitted = true; } }
      function xy(e){ var r = cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*1000, (e.clientY-r.top)/r.height*1000]; }
      function check(){ var a = flat(); if(a.length<20 || closed) return; var f = a[0], l = a[a.length-1];
        if(Math.hypot(f[0]-l[0], f[1]-l[1]) < 70 && turnOf(a) >= Math.PI*(st.shape==='circle'?1.7:1.5)){ closed = true; msg.textContent = '✅ '+(st.shape==='circle'?'원이':'도형이')+' 이어졌어요!'; buzz([40,30,60]); } }
      cv.addEventListener('pointerdown', function(e){ if(finished || Date.now()<st.at) return; e.preventDefault(); drawing = true; try{ cv.setPointerCapture(e.pointerId); }catch(x){} var q = xy(e); if(pts.length) pts.push(null); pts.push(q); closed = false; msg.textContent = ''; redraw(); });
      cv.addEventListener('pointermove', function(e){ if(!drawing) return; e.preventDefault(); var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; (evs.length?evs:[e]).forEach(function(ev){ pts.push(xy(ev)); }); redraw(); check(); });
      ['pointerup','pointercancel'].forEach(function(n){ cv.addEventListener(n, function(){ drawing = false; check(); }); });
      ctx.app.querySelector('#dredo').onclick = function(){ if(finished) return; pts = []; closed = false; msg.textContent = ''; redraw(); };
      ctx.app.querySelector('#dsubmit').onclick = function(){ if(finished) return; sendNow(); msg.textContent = submitted ? '📨 제출했어요! 남은 시간에 다시 그려서 제출할 수도 있어요' : '조금 더 길게 그려 주세요'; };
      clearInterval(S.rxTimer);
      S.rxTimer = setInterval(function(){ var now = Date.now();
        if(now < st.at){ goEl.textContent = Math.ceil((st.at-now)/1000); top.textContent = KO[st.shape]+'을(를) 그려요!'; return; }
        goEl.style.display = 'none'; var l = Math.max(0, Math.ceil((end-now)/1000)); top.innerHTML = KO[st.shape]+' · 남은 시간 <b style="color:'+(l<=5?'#E5195A':'var(--ink)')+'">'+l+'</b>초';
        if(now >= end && !finished){ finished = true; clearInterval(S.rxTimer); sendNow(); app2(ctx, submitted); } }, 100);
      return;
    }
    if(st.phase==='reveal'){ var sc = st.scores && st.scores[S.me.id]; return center(ctx, '<div class="muted">내 점수</div><div class="pts pop" style="font-size:90px;color:var(--coral)">'+(sc==null?0:sc)+'점</div>'+me(ctx,110, sc>=70?'m-jump':'m-sway')+'<div class="muted">큰 화면에서 내 그림을 확인하세요</div>'); }
    waiting(ctx, '그림 채점 중…', '');
  };
  function app2(ctx, ok){ center(ctx, '<div class="big">시간 끝!</div>'+me(ctx,110)+'<div class="muted">'+(ok?'그림을 제출했어요':'그림을 제출하지 못했어요')+'<br>결과를 기다려요</div>'); }
})();
