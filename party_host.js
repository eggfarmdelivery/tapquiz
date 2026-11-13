/* 분위기형 게임 - 큰 화면(방장) 쪽 진행 로직 */
(function(){
  'use strict';
  var P = window.TQParty, esc = P.esc, rnd = P.rnd, rndf = P.rndf, shuffle = P.shuffle, sleep = P.sleep, av = P.av, ls = P.ls, lsSet = P.lsSet;
  var H = P.games;
  var PAL = ['#FF5D8F','#FFC24B','#2DD4BF','#7AA2FF','#B388FF','#FF8A1F','#6EE7A0','#FF7A7A'];
  var norm = function(s){ return String(s==null?'':s).replace(/\s+/g,'').toLowerCase(); };
  function btn(id, label, cls){ return '<button id="'+id+'" class="'+(cls||'')+'">'+label+'</button>'; }
  function head(g, sub){ return '<h2>'+P.META[g].icon+' '+P.META[g].ko+'</h2>'+(sub?'<div class="mut">'+sub+'</div>':''); }
  function chip(p){ return '<span class="chip">'+av(p,34)+esc(p.nickname)+'</span>'; }
  function $(ctx, id){ return ctx.stage.querySelector('#'+id); }
  function waitUntil(ctx, cond, ms){ return new Promise(function(res){ var t = setInterval(function(){ if(ctx.stopped() || cond()){ clearInterval(t); res(); } }, ms||250); }); }

  /* ───────── 🎟️ 행운권 추첨 ───────── */
  H.raffle = function(ctx){
    var prizes = ls('tq_raffle_prizes', [{name:'1등 치킨 기프티콘', n:1},{name:'2등 커피 쿠폰', n:2},{name:'3등 과자 세트', n:3}]);
    var once = ls('tq_raffle_once', true), winners = [];
    function cfg(){
      ctx.stage.innerHTML = '<div class="pt">'+head('raffle','상품을 미리 등록해요. 위에서부터 차례로 추첨해요 (큰 상품을 위에 두세요). 내용은 이 브라우저에 저장돼요.')
        +'<div class="box" id="plist">'+prizes.map(function(p,i){ return '<div class="row" style="margin-bottom:8px"><input type="text" data-k="name" data-i="'+i+'" value="'+esc(p.name)+'" placeholder="상품 이름" style="flex:1;min-width:180px"><input type="number" min="1" max="50" data-k="n" data-i="'+i+'" value="'+p.n+'" style="width:84px"><span class="mut">개</span><button class="ghost" data-del="'+i+'" style="height:44px;padding:0 14px">삭제</button></div>'; }).join('')
        +'<div class="row"><button class="ghost" id="padd" style="height:46px">+ 상품 추가</button><label style="display:flex;align-items:center;gap:8px;margin:0"><input type="checkbox" id="ponce" '+(once?'checked':'')+' style="width:20px;height:20px"> 한 사람은 한 번만 당첨</label></div></div>'
        +'<div class="row">'+btn('pgo','추첨 시작하기','bigbtn')+'<span class="mut">참가자 '+ctx.players().length+'명 · 상품 '+prizes.reduce(function(a,p){ return a+(+p.n||0); },0)+'개</span></div></div>';
      ctx.stage.querySelectorAll('#plist input[data-k]').forEach(function(el){ el.oninput = function(){ var p = prizes[+el.dataset.i]; p[el.dataset.k] = el.dataset.k==='n' ? Math.max(1,+el.value||1) : el.value; lsSet('tq_raffle_prizes', prizes); }; });
      ctx.stage.querySelectorAll('[data-del]').forEach(function(b){ b.onclick = function(){ prizes.splice(+b.dataset.del,1); lsSet('tq_raffle_prizes', prizes); cfg(); }; });
      $(ctx,'padd').onclick = function(){ prizes.push({name:'',n:1}); lsSet('tq_raffle_prizes', prizes); cfg(); };
      $(ctx,'ponce').onchange = function(){ once = this.checked; lsSet('tq_raffle_once', once); };
      $(ctx,'pgo').onclick = function(){ prizes = prizes.filter(function(p){ return p.name.trim(); }); if(!prizes.length){ alert('상품을 하나 이상 등록해 주세요'); cfg(); return; } lsSet('tq_raffle_prizes', prizes); run(); };
    }
    async function run(){
      var draws = []; prizes.forEach(function(p){ for(var i=0;i<p.n;i++) draws.push({ name:p.name.trim(), no:i+1, of:p.n }); });
      for(var di=0; di<draws.length && !ctx.stopped(); di++){
        var d = draws[di], pool = ctx.players().filter(function(p){ return !once || !winners.some(function(w){ return w.p.id===p.id; }); });
        if(!pool.length){ break; }
        ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('raffle')+'<div class="box" style="width:100%;max-width:760px"><div class="mut">'+(di+1)+' / '+draws.length+'번째 추첨</div><div class="display" style="font-size:clamp(30px,4vw,52px);color:var(--coral);margin:6px 0 14px">'+esc(d.name)+(d.of>1?' <small style="font-size:.5em;color:var(--muted)">('+d.no+'/'+d.of+')</small>':'')+'</div><div id="slot" style="height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:var(--card2);border:3px solid var(--ink);border-radius:20px"><div class="mut">준비되면 눌러요</div></div></div>'+btn('rgo','🎰 추첨!','bigbtn')+'</div>';
        await new Promise(function(r){ $(ctx,'rgo').onclick = r; });
        $(ctx,'rgo').classList.add('hidden');
        var win = pool[rnd(pool.length)]; ctx.set({ phase:'roll', prize:d.name });
        var slot = $(ctx,'slot'), t = 0, delay = 60;
        while(t < 2800 && !ctx.stopped()){ var f = pool[rnd(pool.length)]; slot.innerHTML = av(f,110)+'<div style="font-family:var(--display);font-size:34px">'+esc(f.nickname)+'</div>'; await sleep(delay); t += delay; delay = Math.min(delay*1.12, 420); }
        winners.push({ p:win, prize:d.name });
        slot.innerHTML = '<div class="pop" style="display:flex;flex-direction:column;align-items:center;gap:6px">'+av(win,120)+'<div style="font-family:var(--display);font-size:44px;color:var(--coral)">🎉 '+esc(win.nickname)+'</div></div>';
        ctx.set({ phase:'win', pid:win.id, name:win.nickname, prize:d.name });
        if(di < draws.length-1){ var nb = document.createElement('div'); nb.innerHTML = btn('rnext','다음 추첨 →','bigbtn'); ctx.stage.querySelector('.pt').appendChild(nb); await new Promise(function(r){ $(ctx,'rnext').onclick = r; }); }
      }
      if(ctx.stopped()) return;
      var sum = winners.map(function(w){ return '<div class="rank"><span class="nm">'+esc(w.prize)+'</span>'+chip(w.p)+'</div>'; }).join('') || '<div class="mut">당첨자가 없어요</div>';
      ctx.set({ phase:'end' });
      ctx.finish({}, { label:'행운권 추첨 결과', answer:'🎉 당첨을 축하해요!', stat:winners.length+'명 당첨', distTitle:'당첨자 명단', distHtml:sum });
    }
    cfg();
  };

  /* ───────── 🎡 돌림판 ───────── */
  H.wheel = function(ctx){
    var items = ls('tq_wheel_items', ['커피 쏘기','노래 한 곡','벌칙 없음','간식 사기','셀카 찍기','춤 한 번']);
    var ang = 0, spinning = false, result = [];
    function cfg(){
      ctx.stage.innerHTML = '<div class="pt">'+head('wheel','돌림판에 넣을 항목을 한 줄에 하나씩 적어요 (2~12개). 내용은 이 브라우저에 저장돼요.')
        +'<textarea id="witems" rows="8" style="max-width:520px">'+esc(items.join('\n'))+'</textarea><div class="row">'+btn('wgo','돌림판 만들기','bigbtn')+'</div></div>';
      $(ctx,'wgo').onclick = function(){ var l = $(ctx,'witems').value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean).slice(0,12); if(l.length<2){ alert('항목을 2개 이상 적어 주세요'); return; } items = l; lsSet('tq_wheel_items', items); show(); };
    }
    function draw(cv){
      var c = cv.getContext('2d'), W = cv.width, R = W/2-14, n = items.length, a0 = ang;
      c.clearRect(0,0,W,W); c.lineWidth = 4; c.strokeStyle = '#1B1530'; c.font = '700 22px "Noto Sans KR",sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
      for(var i=0;i<n;i++){ var s = a0 + i*2*Math.PI/n, e = s + 2*Math.PI/n;
        c.beginPath(); c.moveTo(W/2,W/2); c.arc(W/2,W/2,R,s,e); c.closePath(); c.fillStyle = PAL[i%PAL.length]; c.fill(); c.stroke();
        c.save(); c.translate(W/2,W/2); c.rotate((s+e)/2); c.fillStyle = '#1B1530'; c.fillText(items[i].length>9? items[i].slice(0,9)+'…' : items[i], R-18, 0); c.restore(); }
      c.beginPath(); c.arc(W/2,W/2,22,0,7); c.fillStyle = '#fff'; c.fill(); c.stroke();
    }
    function show(){
      ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('wheel')+'<div style="position:relative;width:min(520px,80vw)"><canvas id="wcv" width="560" height="560" style="width:100%;height:auto"></canvas><div style="position:absolute;left:50%;top:-6px;transform:translateX(-50%);font-size:46px;line-height:1">🔻</div></div><div id="wres" class="display" style="font-size:44px;min-height:56px;color:var(--coral)"></div><div class="row" id="wbtns">'+btn('wspin','🎡 돌리기!','bigbtn')+btn('wend','끝내기','ghost bigbtn')+'</div></div>';
      var cv = $(ctx,'wcv'); draw(cv);
      $(ctx,'wend').onclick = function(){ ctx.set({phase:'end'}); ctx.finish({}, { label:'돌림판 결과', answer:result.length ? esc(result[result.length-1]) : '돌리지 않았어요', stat:'총 '+result.length+'번 돌렸어요', distTitle:'나온 결과', distHtml:result.map(function(r,i){ return '<div class="rank"><span class="no">'+(i+1)+'</span><span class="nm">'+esc(r)+'</span></div>'; }).join('') }); };
      $(ctx,'wspin').onclick = function(){
        if(spinning) return; spinning = true; $(ctx,'wres').textContent = ''; ctx.set({ phase:'spin' });
        var n = items.length, pick = rnd(n), seg = 2*Math.PI/n;
        // 포인터(위쪽, -90도)에 pick 조각 가운데가 오도록
        var final = -Math.PI/2 - (pick+0.5)*seg + 2*Math.PI*6, start = ang % (2*Math.PI), t0 = performance.now(), dur = 4200, from = start;
        var tgt = final - (final % (2*Math.PI)) + ((final % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI) - (final % (2*Math.PI));
        function step(now){ var k = Math.min(1,(now-t0)/dur), ease = 1-Math.pow(1-k,3); ang = from + (final-from)*ease; draw(cv);
          if(k<1 && !ctx.stopped()) requestAnimationFrame(step); else { spinning = false; result.push(items[pick]); $(ctx,'wres').innerHTML = '<span class="pop" style="display:inline-block">🎉 '+esc(items[pick])+'</span>'; $(ctx,'wspin').textContent = '🎡 한 번 더!'; ctx.set({ phase:'result', text:items[pick] }); } }
        requestAnimationFrame(step);
      };
    }
    cfg();
  };

  /* ───────── 🪜 사다리 타기 ───────── */
  H.ladder = function(ctx){
    var players = ctx.players(), n = players.length;
    var saved = ls('tq_ladder_results', null);
    var defaults = saved && saved.length ? saved : ['커피 쏘기'].concat(Array(Math.max(0,n-1)).fill('통과'));
    function cfg(){
      ctx.stage.innerHTML = '<div class="pt">'+head('ladder','사다리 아래쪽 결과를 한 줄에 하나씩 적어요. 참가자('+n+'명)보다 적으면 "통과"로 채워요. (참가자 수까지만 쓸 수 있어요)')
        +'<textarea id="lres" rows="8" style="max-width:520px">'+esc(defaults.join('\n'))+'</textarea><div class="row">'+btn('lgo','참가자가 줄 고르기 시작','bigbtn')+'</div></div>';
      $(ctx,'lgo').onclick = function(){ var l = $(ctx,'lres').value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean); lsSet('tq_ladder_results', l); pick(l.slice(0,n)); };
    }
    async function pick(list){
      var res = list.slice(0,n); while(res.length<n) res.push('통과'); res = shuffle(res);
      var taken = {}, mine = {};   // taken[k]=pid, mine[pid]=k
      var pubV = ''; ctx.set({ phase:'pick', n:n, taken:{} });
      function paint(){
        var per = Math.min(10,n), tw = n>10?'calc('+(100/per)+'% - 8px)':'86px';
        ctx.stage.innerHTML = '<div class="pt">'+head('ladder','휴대폰에서 원하는 줄 번호를 골라요 ('+Object.keys(mine).length+'/'+n+'명 선택)')
          +(n>10?'<div class="mut">10명 이하가 가장 재밌어요 (현재 '+n+'명)</div>':'')
          +'<div class="row" style="align-items:flex-start;gap:8px;width:100%">'+players.map(function(p,i){ var owner = taken[i] && players.filter(function(x){ return x.id===taken[i]; })[0];
            return '<div class="tile" style="width:'+tw+';flex:'+(n>10?'0 0 auto':'1')+';padding:'+(n>10?'4px 2px':'8px 10px')+';background:'+(owner?'#fff':'transparent')+'"><div style="font-family:var(--display);font-size:'+(n>10?18:26)+'px">'+(i+1)+'</div>'+(owner?av(owner,n>10?34:50)+'<div style="font-size:'+(n>10?11:13)+'px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(owner.nickname)+'</div>':'<div class="mut" style="padding:'+(n>10?'12px 0':'20px 0')+'">'+(n>10?'—':'비어있음')+'</div>')+'</div>'; }).join('')+'</div>'
          +'<div class="row">'+btn('lopen','🪜 사다리 열기!','bigbtn')+'</div></div>';
        $(ctx,'lopen').onclick = go;
      }
      var started = false;
      async function go(){ if(started) return; started = true;
        var free = []; for(var k=0;k<n;k++) if(!taken[k]) free.push(k); free = shuffle(free);
        players.forEach(function(p){ if(mine[p.id]==null){ var k = free.pop(); mine[p.id] = k; taken[k] = p.id; } });
        await run(res, mine, list); }
      paint();
      while(!started && !ctx.stopped()){
        var inp = await ctx.inputs(), changed = false;
        Object.keys(inp).forEach(function(pid){ var k = inp[pid] && inp[pid].pick; if(k==null || k<0 || k>=n) return;
          if(mine[pid]===k) return; if(taken[k] && taken[k]!==pid) return;
          if(mine[pid]!=null) delete taken[mine[pid]]; mine[pid] = k; taken[k] = pid; changed = true; });
        if(changed && !started){ paint(); ctx.set({ phase:'pick', n:n, taken:taken }); }
        await sleep(600);
      }
    }
    async function run(res, mine, list){
      var L = 9, rungs = [], l, k;
      for(l=0;l<L;l++){ rungs.push([]); for(k=0;k<n-1;k++) rungs[l].push(!(k>0 && rungs[l][k-1]) && rndf()<0.5); }
      function trace(k0){ var pos = k0, path = [[k0,0]]; for(var l2=0;l2<L;l2++){ var y = l2+1;
          if(pos<n-1 && rungs[l2][pos]){ path.push([pos,y]); pos++; path.push([pos,y]); } else if(pos>0 && rungs[l2][pos-1]){ path.push([pos,y]); pos--; path.push([pos,y]); } }
        path.push([pos,L+1]); return { path:path, end:pos }; }
      function isWin(k){ return res[k] && res[k]!=='통과'; }
      var winLines = []; for(k=0;k<n;k++) if(isWin(k)) winLines.push(k);
      var W = Math.min(1000, Math.max(520, n*38)), Hh = 380, padX = Math.max(24, Math.min(50, W/(n+1)/1.2));
      var X = function(k){ return padX + (W-2*padX)*(n===1?0.5:k/(n-1)); }, Y = function(y){ return 10 + (Hh-20)*y/(L+1); };
      var avS = n>20?24:n>12?30:40, lw = n>12?3:4;
      function who(k){ return players.filter(function(p){ return mine[p.id]===k; })[0]; }
      var tops = '', bots = '';
      for(k=0;k<n;k++){ var o = who(k), left = (X(k)/W*100).toFixed(2)+'%';
        tops += '<div style="position:absolute;left:'+left+';top:0;transform:translateX(-50%);width:'+avS+'px">'+(o?Jelly.svg(o.avatar,o.team):'')+'</div>';
        bots += '<div class="lb" data-k="'+k+'" style="position:absolute;left:'+left+';top:0;transform:translateX(-50%);text-align:center;font-weight:800;font-size:'+(n>12?11:14)+'px;white-space:nowrap">'+(isWin(k)?'🎁 '+esc(res[k].slice(0,8)):'<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#bbb"></span>')+'</div>'; }
      ctx.stage.innerHTML = '<div class="pt" style="align-items:center">'+head('ladder')+'<div class="box" style="width:100%;max-width:'+(W+40)+'px"><div style="position:relative;height:'+(avS*1.2)+'px">'+tops+'</div><canvas id="lcv" width="'+W+'" height="'+Hh+'" style="display:block;width:100%;height:auto"></canvas><div style="position:relative;height:30px">'+bots+'</div></div><div id="lres" class="row" style="justify-content:center"></div></div>';
      var cv = $(ctx,'lcv'), c = cv.getContext('2d');
      var drawn = [];
      function base(){ c.clearRect(0,0,W,Hh); c.lineWidth = lw; c.strokeStyle = '#1B1530'; c.lineCap = 'round';
        for(var a=0;a<n;a++){ c.beginPath(); c.moveTo(X(a),Y(0)); c.lineTo(X(a),Y(L+1)); c.stroke(); }
        for(var b=0;b<L;b++) for(var d=0;d<n-1;d++) if(rungs[b][d]){ c.beginPath(); c.moveTo(X(d),Y(b+1)); c.lineTo(X(d+1),Y(b+1)); c.stroke(); }
        drawn.forEach(function(q){ c.strokeStyle = q.col; c.lineWidth = lw+2; c.beginPath(); q.path.forEach(function(pt,ix){ var xx = X(pt[0]), yy = Y(pt[1]); if(ix===0) c.moveTo(xx,yy); else c.lineTo(xx,yy); }); c.stroke(); }); }
      base();
      var order = shuffle(players.slice()), outMap = {}, found = [], FR = n>10?3:6, DL = n>10?8:14;
      for(var pi=0; pi<order.length && !ctx.stopped(); pi++){
        var pl = order[pi], k0 = mine[pl.id]; if(k0==null) continue;
        var tr = trace(k0), col = PAL[pi%PAL.length], cur = { col:col, path:tr.path.slice(0,1) };
        drawn.push(cur);
        for(var s=1; s<tr.path.length && !ctx.stopped(); s++){ var a1 = tr.path[s-1], b1 = tr.path[s];
          for(var f=1; f<=FR; f++){ cur.path = tr.path.slice(0,s).concat([[a1[0]+(b1[0]-a1[0])*f/FR, a1[1]+(b1[1]-a1[1])*f/FR]]); base(); await sleep(DL); } }
        cur.path = tr.path; base();
        outMap[pl.id] = res[tr.end];
        if(isWin(tr.end)){
          found.push({ p:pl, prize:res[tr.end] });
          ctx.set({ phase:'run', res:outMap });
          await new Promise(function(done){ var ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;background:rgba(27,21,48,.55);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px';
            ov.innerHTML = '<div class="pt"><div class="box pop" style="text-align:center;padding:26px 40px;background:#fff"><div class="mut">당첨 '+found.length+'/'+winLines.length+'</div><div style="width:150px;margin:6px auto">'+Jelly.svg(pl.avatar,pl.team)+'</div><div class="display" style="font-size:40px;color:var(--coral)">'+esc(pl.nickname)+'</div><div class="display" style="font-size:30px">🎁 '+esc(res[tr.end])+'</div></div></div>';
            document.body.appendChild(ov); setTimeout(function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); done(); }, 3000); });
        } else { await sleep(n>10?40:200); }
        $(ctx,'lres').innerHTML = found.map(function(x){ return '<span class="chip">'+av(x.p,30)+esc(x.p.nickname)+' → <b>'+esc(x.prize)+'</b></span>'; }).join('');
        ctx.set({ phase:'run', res:outMap });
        if(found.length>=winLines.length && winLines.length>0) break;
      }
      if(ctx.stopped()) return;
      // 나머지는 자동 통과
      players.forEach(function(p){ if(outMap[p.id]==null) outMap[p.id] = res[mine[p.id]]!=null ? res[mine[p.id]] : '통과'; });
      ctx.set({ phase:'end', res:outMap });
      found.sort(function(x,y){ return list.indexOf(x.prize)-list.indexOf(y.prize); });
      var cards = found.map(function(x){ return '<div class="tile" style="padding:12px 16px;background:#fff"><div class="mut">🎁 '+esc(x.prize)+'</div><div style="width:'+(found.length>6?56:84)+'px">'+Jelly.svg(x.p.avatar,x.p.team)+'</div><div style="font-size:16px">'+esc(x.p.nickname)+'</div></div>'; }).join('');
      var fin = document.createElement('div'); fin.style.cssText = 'position:fixed;inset:0;background:rgba(27,21,48,.55);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px';
      fin.innerHTML = '<div class="pt" style="align-items:center"><div class="box pop" style="text-align:center;padding:24px 28px;background:#fff;max-width:92vw"><div class="display" style="font-size:34px">🎉 당첨자 발표!</div><div class="row" style="justify-content:center;margin:14px 0">'+(cards||'<div class="mut">당첨자가 없어요</div>')+'</div>'+btn('ldone','마치기 →','bigbtn')+'</div></div>';
      document.body.appendChild(fin);
      fin.querySelector('#ldone') && (fin.querySelector('#ldone').onclick = function(){ if(fin.parentNode) fin.parentNode.removeChild(fin);
        ctx.finish({}, { label:'사다리 결과', answer:'결과 발표!', stat:found.length+'명 당첨', distTitle:'결과', distHtml:players.map(function(p){ return '<div class="rank"><span class="nm">'+esc(p.nickname)+'</span><b>'+esc(outMap[p.id]||'-')+'</b></div>'; }).join('') }); });
    }
    cfg();
  };

  /* ───────── 🔢 순서 정하기 ───────── */
  H.order = function(ctx){
    var players = ctx.players();
    ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('order','버튼을 누르면 무작위로 순서가 정해져요')+btn('ogo','🔢 순서 뽑기!','bigbtn')+'<div id="olist" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;width:100%"></div></div>';
    $(ctx,'ogo').onclick = async function(){
      this.classList.add('hidden'); var ord = shuffle(players).map(function(p){ return p.id; }); ctx.set({ phase:'order', ord:ord });
      var L = $(ctx,'olist');
      for(var i=0;i<ord.length && !ctx.stopped();i++){ var p = players.filter(function(x){ return x.id===ord[i]; })[0]; var d = document.createElement('div'); d.className = 'tile pop'; d.style.minWidth = '110px';
        d.innerHTML = '<div style="font-family:var(--display);font-size:34px;color:var(--coral)">'+(i+1)+'</div>'+av(p,70)+'<div>'+esc(p.nickname)+'</div>'; L.appendChild(d); await sleep(550); }
      if(ctx.stopped()) return;
      var b = document.createElement('div'); b.innerHTML = btn('odone','마치기 →','bigbtn'); ctx.stage.querySelector('.pt').appendChild(b);
      $(ctx,'odone').onclick = function(){ ctx.finish({}, { label:'순서 정하기 결과', answer:'순서가 정해졌어요!', stat:ord.length+'명', distTitle:'순서', distHtml:ord.map(function(id,i){ var p = players.filter(function(x){ return x.id===id; })[0]; return '<div class="rank"><span class="no">'+(i+1)+'</span><span class="nm">'+esc(p.nickname)+'</span></div>'; }).join('') }); };
    };
  };

  /* ───────── 🤥 라이어 게임 ───────── */
  H.liar = function(ctx){
    var players = ctx.players(), cat = ls('tq_liar_cat','random'), cnt = 1;
    function cfg(){
      ctx.stage.innerHTML = '<div class="pt">'+head('liar','모두에게 제시어가 주어지는데, 라이어만 카테고리만 알아요. 한 명씩 말로 설명한 뒤 투표로 라이어를 찾아요.')
        +'<div class="box"><div class="row" style="margin-bottom:10px"><b>카테고리</b>'+['random'].concat(Object.keys(P.CAT_KO)).map(function(k){ return '<button class="ghost cb" data-c="'+k+'" style="height:44px;padding:0 16px;'+(cat===k?'background:var(--gold);color:var(--ink)':'')+'">'+(k==='random'?'🎲 랜덤':P.CAT_KO[k])+'</button>'; }).join('')+'</div>'
        +'<div class="row"><b>라이어 수</b><button class="ghost nb" data-n="1" style="height:44px;padding:0 16px;'+(cnt===1?'background:var(--gold);color:var(--ink)':'')+'">1명</button><button class="ghost nb" data-n="2" '+(players.length<5?'disabled':'')+' style="height:44px;padding:0 16px;'+(cnt===2?'background:var(--gold);color:var(--ink)':'')+'">2명</button>'+(players.length<5?'<span class="mut">(5명 이상일 때 선택 가능)</span>':'')+'</div></div>'
        +'<div class="row">'+btn('lgo','게임 시작 (카드 나눠주기)','bigbtn')+'<span class="mut">참가자 '+players.length+'명 (최소 3명 권장)</span></div></div>';
      ctx.stage.querySelectorAll('.cb').forEach(function(b){ b.onclick = function(){ cat = b.dataset.c; lsSet('tq_liar_cat',cat); cfg(); }; });
      ctx.stage.querySelectorAll('.nb').forEach(function(b){ b.onclick = function(){ cnt = +b.dataset.n; cfg(); }; });
      $(ctx,'lgo').onclick = function(){ if(players.length<3){ alert('라이어 게임은 3명 이상이 필요해요'); return; } play(); };
    }
    async function play(){
      var c = cat==='random' ? Object.keys(P.CAT_KO)[rnd(5)] : cat, word = P.WORDS[c][rnd(P.WORDS[c].length)];
      var liars = shuffle(players).slice(0,cnt).map(function(p){ return p.id; }), order = shuffle(players);
      ctx.set({ phase:'role', cat:c, catKo:P.CAT_KO[c], word:word, liars:liars });
      ctx.stage.innerHTML = '<div class="pt">'+head('liar')+'<div class="box" style="text-align:center"><div class="mut">카테고리</div><div class="display" style="font-size:54px;color:var(--coral)">'+esc(P.CAT_KO[c])+'</div><div class="mut">휴대폰에서 카드를 눌러 제시어를 확인하세요 (다른 사람에게 보여주면 안 돼요!)</div></div>'
        +'<div class="box"><b>설명 순서</b> <span class="mut">(순서대로 한 마디씩, 제시어를 직접 말하지 않고 설명해요)</span><div class="row" style="margin-top:10px">'+order.map(function(p,i){ return '<span class="chip"><b>'+(i+1)+'</b>'+av(p,34)+esc(p.nickname)+'</span>'; }).join('')+'</div></div>'
        +'<div class="row">'+btn('lvote','🗳️ 투표 시작','bigbtn')+'</div></div>';
      await new Promise(function(r){ $(ctx,'lvote').onclick = r; }); if(ctx.stopped()) return;
      // 투표
      ctx.set({ phase:'vote', cat:c, catKo:P.CAT_KO[c], word:word, liars:liars });
      var votes = {};
      function paintVote(){ ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('liar','휴대폰에서 라이어라고 생각하는 사람을 눌러요')+'<div class="display" style="font-size:60px;color:var(--coral)">'+Object.keys(votes).length+' / '+players.length+'</div>'+btn('lclose','투표 마감 →','bigbtn')+'</div>'; }
      paintVote(); var closed = false; $(ctx,'lclose').onclick = function(){ closed = true; };
      while(!closed && Object.keys(votes).length<players.length && !ctx.stopped()){
        var inp = await ctx.inputs(); Object.keys(inp).forEach(function(pid){ if(inp[pid] && inp[pid].vote) votes[pid] = inp[pid].vote; });
        var el = ctx.stage.querySelector('.display'); if(el) el.textContent = Object.keys(votes).length+' / '+players.length; await sleep(500);
        if($(ctx,'lclose')==null) break; }
      if(ctx.stopped()) return;
      var tally = {}; Object.keys(votes).forEach(function(pid){ tally[votes[pid]] = (tally[votes[pid]]||0)+1; });
      var top = Object.keys(tally).sort(function(a,b){ return tally[b]-tally[a]; }), tie = top.length>1 && tally[top[0]]===tally[top[1]];
      var accused = (!top.length || tie) ? null : top[0], caught = !!accused && liars.indexOf(accused)>=0;
      var liarNames = liars.map(function(id){ return players.filter(function(p){ return p.id===id; })[0]; });
      var guessOk = false, guess = '';
      if(caught){
        ctx.set({ phase:'guess', cat:c, catKo:P.CAT_KO[c], word:word, liars:liars, accused:accused });
        var left = 25; ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('liar','라이어가 잡혔어요! 하지만 제시어를 맞히면 역전승!')+'<div class="display" style="font-size:28px">'+liarNames.map(function(p){ return esc(p.nickname); }).join(', ')+'</div><div class="mut">카테고리: '+esc(P.CAT_KO[c])+'</div><div class="display" id="lgt" style="font-size:72px;color:var(--coral)">'+left+'</div>'+btn('lend','추측 마감','ghost')+'</div>';
        var done2 = false; $(ctx,'lend').onclick = function(){ done2 = true; };
        while(left>0 && !done2 && !ctx.stopped()){ await sleep(1000); left--; var g = $(ctx,'lgt'); if(g) g.textContent = left; var inp2 = await ctx.inputs(); if(liars.some(function(id){ return inp2[id] && inp2[id].guess; })) break; }
        var inp3 = await ctx.inputs(); liars.forEach(function(id){ var gg = inp3[id] && inp3[id].guess; if(gg){ guess = gg; if(norm(gg)===norm(word)) guessOk = true; } });
      }
      var liarsWin = !caught || guessOk;
      ctx.set({ phase:'reveal', cat:c, catKo:P.CAT_KO[c], word:word, liars:liars, accused:accused, caught:caught, guessOk:guessOk, liarsWin:liarsWin });
      var gain = {}; players.forEach(function(p){ var isL = liars.indexOf(p.id)>=0; gain[p.id] = liarsWin ? (isL?150:0) : (isL?0:100); });
      var accP = players.filter(function(p){ return p.id===accused; })[0];
      ctx.finish(gain, { label:'제시어', answer:esc(word)+' <span style="font-size:.45em;color:var(--muted)">('+esc(P.CAT_KO[c])+')</span>',
        stat:(liarsWin ? '🤥 라이어 승리! ' : '🎉 시민 승리! ')+(caught ? (guessOk ? '라이어가 제시어를 맞혔어요' : '라이어를 찾았어요') : (accP ? '엉뚱한 사람을 지목했어요' : '의견이 갈려 라이어를 못 찾았어요')),
        distTitle:'라이어는 누구?', distHtml:liarNames.map(function(p){ return '<div class="rank"><span class="nm">'+chip(p)+'</span><b>'+(votes && tally[p.id]||0)+'표</b></div>'; }).join('')+(guess?'<div class="mut" style="margin-top:8px">라이어의 추측: '+esc(guess)+'</div>':'') });
    }
    cfg();
  };

  /* ───────── ✏️ 도형 그리기 ───────── */
  var SHAPE_KO = { circle:'동그라미', triangle:'삼각형', heart:'하트' };
  H.draw = function(ctx){
    var o = ctx.q.options || {}, shape = o.shape || 'circle', sec = o.sec || 15, players = ctx.players();
    ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('draw','큰 화면의 '+SHAPE_KO[shape]+'을(를) 보고 휴대폰 화면에 손가락으로 그려요. 가장 비슷하게 그린 사람이 1등! (제한시간 '+sec+'초)')
      +'<div class="box"><svg viewBox="0 0 300 300" width="min(340px,60vw)"><path d="'+P.pathOf(shape,300)+'" fill="none" stroke="#1B1530" stroke-width="10" stroke-linejoin="round" stroke-dasharray="2 14" stroke-linecap="round"/></svg><div class="display" style="font-size:38px;color:var(--coral)">'+SHAPE_KO[shape]+'</div></div>'+btn('dgo','✏️ 시작! (3·2·1)','bigbtn')+'</div>';
    $(ctx,'dgo').onclick = async function(){
      this.classList.add('hidden');
      var at = Date.now()+3500; ctx.set({ phase:'draw', shape:shape, at:at, sec:sec });
      var end = at + sec*1000, st = $(ctx,'dgo').parentNode;
      var big = document.createElement('div'); big.className = 'display'; big.style.cssText = 'font-size:90px;color:var(--coral)'; st.appendChild(big);
      var got = {};
      while(!ctx.stopped()){
        var now = Date.now(); big.textContent = now<at ? Math.ceil((at-now)/1000) : Math.max(0, Math.ceil((end-now)/1000))+'초';
        var inp = await ctx.inputs(); Object.keys(inp).forEach(function(pid){ if(inp[pid] && inp[pid].pts && inp[pid].fin) got[pid] = inp[pid]; });
        if(Object.keys(got).length>=players.length && now>at+2000) break;
        if(now > end+2500) break; await sleep(400); }
      if(ctx.stopped()) return;
      var inpF = await ctx.inputs(); Object.keys(inpF).forEach(function(pid){ if(inpF[pid] && inpF[pid].pts) got[pid] = inpF[pid]; });
      big.textContent = '채점 중…';
      var rows = players.map(function(p){ var d = got[p.id]; var r = d ? P.scoreDrawing(shape, d.pts.map(function(q){ return [q[0],q[1]]; })) : { score:0, note:'제출 안 함', fit:null }; return { p:p, d:d, r:r }; });
      var gain = {}; rows.forEach(function(x){ gain[x.p.id] = x.r.score; });
      var asc = rows.slice().sort(function(a,b){ return a.r.score-b.r.score; }), best = asc[asc.length-1];
      var cards = asc.map(function(x,i){ var win = x===best && x.r.score>0;
        var svg = '<svg viewBox="0 0 1000 1000" style="width:100%;background:#fff;border-radius:10px;border:3px solid '+(win?'#FFC24B':'#1B1530')+'">';
        if(x.d){ svg += '<polyline fill="none" stroke="#FF5D8F" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" points="'+x.d.pts.map(function(q){ return q[0]+','+q[1]; }).join(' ')+'"/>';
          if(x.r.fit){ if(x.r.fit.type==='circle') svg += '<circle cx="'+x.r.fit.cx+'" cy="'+x.r.fit.cy+'" r="'+x.r.fit.r+'" fill="none" stroke="#2DD4BF" stroke-width="10" stroke-dasharray="26 18"/>';
            else svg += '<polyline fill="none" stroke="#2DD4BF" stroke-width="10" stroke-dasharray="26 18" points="'+x.r.fit.pts.map(function(q){ return q[0].toFixed(0)+','+q[1].toFixed(0); }).join(' ')+'"/>'; } }
        svg += '</svg>';
        return '<div class="tile pop" style="animation-delay:'+(i*0.35)+'s;'+(win?'background:var(--gold);box-shadow:5px 5px 0 var(--ink)':'')+'">'+svg+'<div>'+(win?'👑 ':'')+esc(x.p.nickname)+'</div><div style="font-family:var(--display);font-size:28px;color:'+(win?'var(--ink)':'var(--coral)')+'">'+x.r.score+'점</div>'+(x.r.score===0?'<div class="mut" style="font-size:12px">'+esc(x.r.note||'')+'</div>':'')+'</div>'; }).join('');
      ctx.stage.innerHTML = '<div class="pt">'+head('draw','낮은 점수부터 공개! 빨강=내 그림, 민트 점선=맞춰본 '+SHAPE_KO[shape])+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px">'+cards+'</div><div class="row">'+btn('ddone','결과 점수 반영하기 →','bigbtn')+'</div></div>';
      ctx.set({ phase:'reveal', shape:shape, scores:rows.reduce(function(m,x){ m[x.p.id]=x.r.score; return m; },{}) });
      $(ctx,'ddone').onclick = function(){ ctx.finish(gain, { label:SHAPE_KO[shape]+' 그리기 1등', answer: best && best.r.score>0 ? esc(best.p.nickname)+' <span style="font-size:.5em;color:var(--muted)">'+best.r.score+'점</span>' : '아무도 점수를 못 받았어요',
        stat:'제출 '+Object.keys(got).length+'명 / '+players.length+'명', distTitle:'점수 순서', distHtml:rows.slice().sort(function(a,b){ return b.r.score-a.r.score; }).slice(0,6).map(function(x,i){ return '<div class="dist'+(i===0?' ok':'')+'"><span class="l">'+(i+1)+'. '+esc(x.p.nickname)+'</span><span class="b"><i style="width:'+Math.max(3,x.r.score)+'%"></i></span><span class="c">'+x.r.score+'점</span></div>'; }).join('') }); };
    };
  };

  /* ───────── ✌️ 가위바위보 서바이벌 ───────── */
  var BEATS = { rock:'scissors', scissors:'paper', paper:'rock' };   // key 가 value 를 이김
  H.rps = function(ctx){
    var players = ctx.players(), alive = players.map(function(p){ return p.id; }), roundNo = 0, surv = {};
    ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('rps','컴퓨터를 이긴 사람만 살아남아요! 비기거나 지거나 안 내면 탈락. 마지막 2명이 남으면 결승 대결!')+'<div style="font-size:90px">✊ ✌️ 🖐️</div>'+btn('rgo','시작!','bigbtn')+'</div>';
    $(ctx,'rgo').onclick = function(){ loop(); };
    function pl(id){ return players.filter(function(p){ return p.id===id; })[0]; }
    function aliveHTML(){ return '<div class="row" style="justify-content:center">'+alive.map(function(id){ return chip(pl(id)); }).join('')+'</div>'; }
    async function collect(sec, rno, tag){
      var at = Date.now()+1500, end = at+sec*1000;
      ctx.set({ phase:'pick', round:rno, tag:tag, alive:alive, at:at, sec:sec });
      var big = ctx.stage.querySelector('#rbig'), picks = {};
      while(!ctx.stopped()){ var now = Date.now(); if(big) big.textContent = now<at ? '준비…' : Math.max(0,Math.ceil((end-now)/1000));
        var inp = await ctx.inputs(); alive.forEach(function(id){ var v = inp[id]; if(v && v.round===rno && v.tag===tag && v.pick) picks[id] = v.pick; });
        if(Object.keys(picks).length>=alive.length && now>at+500) break; if(now>end+1200) break; await sleep(300); }
      return picks;
    }
    async function loop(){
      while(!ctx.stopped()){
        roundNo++;
        var final2 = alive.length===2, tag = final2 ? 'final' : 'round';
        if(alive.length===1) break;
        var comp = ['rock','paper','scissors'][rnd(3)];
        ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('rps', final2 ? '🏆 결승 대결! 두 사람이 서로 겨뤄요' : roundNo+'라운드 · 컴퓨터를 이겨라!')+'<div style="font-size:110px;line-height:1">❓</div><div class="display" id="rbig" style="font-size:80px;color:var(--coral)"></div>'+aliveHTML()+'</div>';
        var picks = await collect(5, roundNo, tag); if(ctx.stopped()) return;
        if(final2){
          var a = alive[0], b = alive[1], pa = picks[a] || null, pb = picks[b] || null, res;
          if(pa && !pb) res = a; else if(pb && !pa) res = b; else if(!pa && !pb) res = null; else if(pa===pb) res = null; else res = BEATS[pa]===pb ? a : b;
          ctx.set({ phase:'duel', alive:alive, a:a, b:b, pa:pa, pb:pb, win:res });
          ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('rps','🏆 결승 결과')+'<div class="row" style="justify-content:center;gap:40px"><div class="tile" style="padding:14px 24px">'+av(pl(a),90)+'<div>'+esc(pl(a).nickname)+'</div><div style="font-size:90px;line-height:1">'+(pa?P.HAND[pa]:'🚫')+'</div></div><div class="display" style="font-size:44px">VS</div><div class="tile" style="padding:14px 24px">'+av(pl(b),90)+'<div>'+esc(pl(b).nickname)+'</div><div style="font-size:90px;line-height:1">'+(pb?P.HAND[pb]:'🚫')+'</div></div></div><div class="display" style="font-size:40px;color:var(--coral)">'+(res? '🎉 '+esc(pl(res).nickname)+' 승리!' : '비겼어요! 다시 한 판!')+'</div></div>';
          await sleep(res?3500:3200);
          if(res){ alive = [res]; } continue;
        }
        var surv2 = alive.filter(function(id){ return picks[id] && BEATS[picks[id]]===comp; });
        ctx.set({ phase:'reveal', round:roundNo, comp:comp, picks:picks, alive:alive, surv:surv2 });
        ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('rps',roundNo+'라운드 결과')+'<div class="mut">컴퓨터가 낸 것</div><div class="pop" style="font-size:120px;line-height:1">'+P.HAND[comp]+'</div><div class="display" style="font-size:30px">'+P.HAND_KO[comp]+'</div><div class="row" style="justify-content:center">'+alive.map(function(id){ var ok = surv2.indexOf(id)>=0; return '<div class="tile" style="opacity:'+(ok?1:.45)+'">'+av(pl(id),56)+'<div style="font-size:13px">'+esc(pl(id).nickname)+'</div><div style="font-size:28px">'+(picks[id]?P.HAND[picks[id]]:'🚫')+(ok?' ✅':' ❌')+'</div></div>'; }).join('')+'</div>'
          +'<div class="display" style="font-size:30px;color:var(--coral)">'+(surv2.length? surv2.length+'명 생존!' : '아무도 못 이겼어요 · 다시!')+'</div></div>';
        await sleep(3800);
        if(surv2.length){ surv2.forEach(function(id){ surv[id] = (surv[id]||0)+1; }); alive = surv2; }
      }
      if(ctx.stopped()) return;
      var champ = alive[0] && pl(alive[0]); var gain = {}; players.forEach(function(p){ gain[p.id] = (surv[p.id]||0)*20 + (champ && p.id===champ.id ? 100 : 0); });
      ctx.set({ phase:'end', champ:champ&&champ.id });
      ctx.finish(gain, { label:'가위바위보 최후의 1인', answer: champ ? esc(champ.nickname) : '우승자가 없어요', stat:'총 '+roundNo+'라운드', distTitle:'살아남은 횟수', distHtml:players.slice().sort(function(a,b){ return (gain[b.id]||0)-(gain[a.id]||0); }).slice(0,6).map(function(p){ return '<div class="rank"><span class="nm">'+(champ&&p.id===champ.id?'👑 ':'')+esc(p.nickname)+'</span><b>+'+(gain[p.id]||0)+'점</b></div>'; }).join('') });
    }
  };

  /* ───────── 💣 폭탄 돌리기 ───────── */
  H.bomb = function(ctx){
    var all = ctx.players(), survival = false;
    ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('bomb','폭탄을 들고 있는 사람의 휴대폰에 "넘기기!" 버튼이 떠요. 옆 사람에게 넘기세요! 터지는 순간 들고 있는 사람이 벌칙!')
      +'<div style="font-size:90px">💣</div><label style="display:flex;align-items:center;gap:8px;margin:0;font-size:16px"><input type="checkbox" id="bsurv" style="width:20px;height:20px"> 생존 모드 (터진 사람은 빠지고 한 명 남을 때까지)</label><div class="mut">한 번에 최대 3초만 들고 있을 수 있어요 (넘기지 않으면 자동으로 넘어가요)</div>'+btn('bgo','게임 시작!','bigbtn')+'</div>';
    $(ctx,'bgo').onclick = function(){ survival = $(ctx,'bsurv').checked; loop(); };
    var HOLD_MIN = 500, HOLD_MAX = 3000;
    async function loop(){
      var circle = all.map(function(p){ return p.id; }), pen = {}, rounds = 0;
      function pl(id){ return all.filter(function(p){ return p.id===id; })[0]; }
      while(!ctx.stopped() && circle.length>1){
        rounds++;
        var total = 15000 + rnd(20001), t0 = Date.now() + 3000, boom = t0 + total, hold = rnd(circle.length), seq = 0, holdAt = t0, passes = 0;
        function paint(){ var n = circle.length, big = n>12, nxt = (hold+1)%n, aw = big?(n>20?34:42):60;
          ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center">'+head('bomb', survival?rounds+'라운드':'')+'<div id="bring" style="position:relative;width:min('+(big?640:560)+'px,92vw);height:min('+(big?640:560)+'px,92vw)">'+circle.map(function(id,i){ var a = -Math.PI/2 + i*2*Math.PI/n, x = 50+42*Math.cos(a), y = 50+42*Math.sin(a), on = i===hold, nx = i===nxt && n>1 && !on, showName = !big || on || nx;
            return '<div style="position:absolute;left:'+x+'%;top:'+y+'%;transform:translate(-50%,-50%);text-align:center;'+(on?'z-index:2':'')+'"><div style="height:'+(big?26:34)+'px;font-size:'+(big?24:30)+'px">'+(on?'<span class="shake">💣</span>':'')+'</div><div style="width:'+(on?(big?72:84):aw)+'px;margin:0 auto;'+(on?'filter:drop-shadow(0 0 10px #FF5D8F)':'')+'">'+Jelly.svg(pl(id).avatar,pl(id).team)+'</div>'+(showName?'<div style="font-weight:800;font-size:'+(big?13:14)+'px;background:'+(nx?'#FFE066':'#fff')+';border:2px solid var(--ink);border-radius:999px;padding:1px 8px;display:inline-block;white-space:nowrap;'+(nx?'margin-top:16px;':'')+'">'+(nx?'다음 · ':'')+esc(pl(id).nickname)+'</div>':'')+'</div>'; }).join('')
            +'<div class="display" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:64px;color:var(--coral)" id="bcd"></div></div></div>'; }
        paint(); ctx.set({ phase:'bomb', circle:circle, holder:circle[hold], seq:seq, at:holdAt, max:HOLD_MAX, min:HOLD_MIN, t0:t0, u:0 });
        var cd = $(ctx,'bcd');
        while(!ctx.stopped()){
          var now = Date.now();
          if(now < t0){ cd = $(ctx,'bcd'); if(cd) cd.textContent = Math.ceil((t0-now)/1000); await sleep(150); holdAt = t0; continue; }
          if(cd) cd.textContent = '';
          if(now >= boom) break;
          var inp = await ctx.inputs(), hid = circle[hold], v = inp[hid], now2 = Date.now();
          var passNow = (v && v.pass===seq && now2-holdAt>=HOLD_MIN) || (now2-holdAt>=HOLD_MAX);
          if(passNow){ hold = (hold+1)%circle.length; seq++; holdAt = Date.now(); passes++; paint(); cd = $(ctx,'bcd'); ctx.set({ phase:'bomb', circle:circle, holder:circle[hold], seq:seq, at:holdAt, max:HOLD_MAX, min:HOLD_MIN, t0:t0, u:Math.min(1,(holdAt-t0)/total) }); }
          await sleep(120);
        }
        if(ctx.stopped()) return;
        var loser = circle[hold]; pen[loser] = (pen[loser]||0)+1;
        ctx.set({ phase:'boom', loser:loser, circle:circle });
        ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center"><div class="pop" style="font-size:150px;line-height:1">💥</div><div class="tile" style="padding:14px 30px">'+av(pl(loser),110)+'<div class="display" style="font-size:40px;color:var(--coral)">'+esc(pl(loser).nickname)+'</div></div><div class="display" style="font-size:38px">펑! 벌칙 당첨!</div><div class="mut">'+passes+'번 넘겼어요 · 폭탄이 터질 때까지 '+Math.round(total/1000)+'초</div></div>';
        await sleep(4500);
        if(!survival) break;
        circle = circle.filter(function(id){ return id!==loser; });
      }
      if(ctx.stopped()) return;
      var gain = {}; all.forEach(function(p){ gain[p.id] = pen[p.id] ? 0 : (survival ? (circle.indexOf(p.id)>=0 ? 100 : 30) : 50); });
      var losers = all.filter(function(p){ return pen[p.id]; });
      ctx.set({ phase:'end' });
      ctx.finish(gain, { label: survival ? '마지막 생존자' : '벌칙 당첨자', answer: survival && circle.length===1 ? esc(pl(circle[0]).nickname) : losers.map(function(p){ return esc(p.nickname); }).join(', '),
        stat: survival ? '터진 순서대로 탈락했어요' : '벌칙을 수행해 주세요!', distTitle:'벌칙 횟수', distHtml: losers.map(function(p){ return '<div class="rank"><span class="nm">'+esc(p.nickname)+'</span><b>'+pen[p.id]+'번 💥</b></div>'; }).join('') });
    }
  };
})();
