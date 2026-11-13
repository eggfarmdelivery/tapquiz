/* 두뇌 미니게임 4종 공용 (host/player/demo 공용): 기억력 패턴 / 숫자 순서 터치 / 카드 위치 기억 / 눈치게임
 * 같은 seq + 같은 시작 시각(startAt)이면 큰 화면과 휴대폰이 똑같이 진행돼요.
 */
(function(){
  var EMOJI = ['🍎','🍌','🍇','🍓','🍉','🍑','🍋','🥝','🍒','🥕','🍕','🍩','🍪','⚽','🚗','🐶'];
  function pick(arr, n){ var a = arr.slice(), r = []; while(r.length<n && a.length){ r.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return r; }
  function range(n){ var a=[]; for(var i=0;i<n;i++) a.push(i); return a; }

  function make(type, o, players){
    if (type==='memory'){
      var cells = o.cols*o.cols, order = [], last = -1;
      for (var i=0;i<o.len;i++){ var k; do{ k = Math.floor(Math.random()*cells); }while(k===last); last = k; order.push(k); }
      return { cols:o.cols, rows:o.cols, order:order, step:o.step||800 };
    }
    if (type==='tapnum'){
      var cols = 4, rows = 4;
      var KO = '가나다라마바사아자차카타파하'.split(''), AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), kind = o.kind || 'num', labels = [];
      for (var q = 0; q < o.n; q++) labels.push(kind==='abc' ? AB[q] : kind==='ko' ? KO[q] : String(q+1));
      return { cols:cols, rows:rows, n:o.n, kind:kind, labels:labels, pos:pick(range(cols*rows), o.n) };   // pos[k] = 숫자 k+1이 있는 칸
    }
    if (type==='cardpos'){
      var cs = o.cols*o.rows, combos = [], cards;
      var cl = pick(range(8), 8), ac = pick(range(6), 6);
      for (var u = 0; u < cs; u++) combos.push(cl[u%8]+','+ac[(u + Math.floor(u/6)) % 6]);
      cards = pick(combos, cs);
      return { cols:o.cols, rows:o.rows, cards:cards, ask:Math.floor(Math.random()*cs), showMs:o.showMs||3500 };
    }
    if (type==='nunchi'){
      return { max: Math.max(4, Math.min(9, Math.ceil((players||3)*0.8)+1)) };
    }
  }
  function totalMs(type, seq){
    if (type==='memory') return 400 + seq.order.length*seq.step + 300 + 15000;
    if (type==='tapnum') return 30000;
    if (type==='cardpos') return seq.showMs + 12000;
    return 12000;
  }

  function mount(type, el, seq, startAt, opts){
    opts = opts || {};
    var stopped = false, shown = '', done = false, p = 0, next = 1;
    el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
    var cols = seq.cols || 3, rows = seq.rows || cols;
    var cellStyle = 'background:#fff;border:3px solid #1B1530;box-shadow:0 3px 0 #1B1530;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;min-width:0;min-height:0;user-select:none;transition:background .1s;';
    function gridOpen(){ return '<div style="height:100%;max-width:100%;aspect-ratio:'+cols+'/'+rows+';display:grid;grid-template-columns:repeat('+cols+',1fr);grid-template-rows:repeat('+rows+',1fr);gap:'+(cols>4?5:8)+'px;padding:8px;box-sizing:border-box;font-size:'+(opts.fs||28)+'px">'; }
    function cellsEl(){ return el.querySelectorAll('.mc'); }
    function setCell(i, bg){ var c = cellsEl()[i]; if (c) c.style.background = bg; }

    function render(now){
      var left = startAt - now, key, html;
      if (!opts.final && left > 0){
        key = 'c'+Math.ceil(left/1000);
        if (key!==shown){ shown = key; el.innerHTML = '<div style="font-size:'+Math.round(Math.min(el.clientHeight,el.clientWidth)*0.5)+'px;color:#FF5D8F;line-height:1;font-weight:800">'+Math.ceil(left/1000)+'</div>'; if (opts.onPhase) opts.onPhase('ready'); }
        return;
      }
      if (type==='memory'){
        var t = now - startAt, showEnd = 400 + seq.order.length*seq.step + 300, ph = t < showEnd ? 'show' : 'input';
        if (opts.final) ph = 'input';
        if (shown.charAt(0)!=='g'){ shown = 'g'+ph; el.innerHTML = gridOpen() + range(cols*rows).map(function(i){ return '<div class="mc" data-i="'+i+'" style="'+cellStyle+'"></div>'; }).join('') + '</div>'; if (opts.onPhase) opts.onPhase(ph); }
        if (ph==='show'){
          var k = Math.floor((t-400)/seq.step), within = (t-400) - k*seq.step;
          range(cols*rows).forEach(function(i){ setCell(i, (k>=0 && k<seq.order.length && within < seq.step*0.7 && i===seq.order[k]) ? '#FFC24B' : '#fff'); });
        } else if (shown!=='ginput'){ shown = 'ginput'; range(cols*rows).forEach(function(i){ setCell(i,'#fff'); }); if (opts.onPhase) opts.onPhase('input'); }
        return;
      }
      if (type==='tapnum'){
        if (shown!=='go'){ shown = 'go'; var pos = {}; seq.pos.forEach(function(c,k){ pos[c] = k+1; });
          el.innerHTML = gridOpen() + range(cols*rows).map(function(i){ return '<div class="mc" data-i="'+i+'" data-n="'+(pos[i]||0)+'" style="'+cellStyle+(pos[i]?'color:#1B1530;cursor:pointer;':'background:transparent;border-color:transparent;box-shadow:none;')+'">'+(pos[i]?seq.labels[pos[i]-1]:'')+'</div>'; }).join('') + '</div>'; if (opts.onPhase) opts.onPhase('go'); }
        return;
      }
      if (type==='cardpos'){
        var t2 = now - startAt, ph2 = (opts.final ? 'final' : t2 < seq.showMs ? 'show' : 'ask');
        if (shown!==ph2){ shown = ph2;
          el.innerHTML = gridOpen() + seq.cards.map(function(e,i){ var face = (ph2!=='ask');
            return '<div class="mc" data-i="'+i+'" style="'+cellStyle+(face?'padding:6%;background:#2A2550;':'background:#7AA2FF;cursor:pointer;')+(ph2==='final'&&i===seq.ask?'outline:5px solid #FF5D8F;outline-offset:2px;':'')+'font-size:'+(opts.fs?opts.fs*1.4:40)+'px">'+(face?Jelly.svg(e):'<span style="font-size:1.3em;color:#fff">?</span>')+'</div>'; }).join('') + '</div>';
          if (opts.onPhase) opts.onPhase(ph2, seq.cards[seq.ask]); }
        return;
      }
      if (type==='nunchi'){
        if (shown!=='go'){ shown = 'go';
          var cs = Math.min(seq.max, 3); var rws = Math.ceil(seq.max/3); cols = cs; rows = rws;
          el.innerHTML = gridOpen() + range(seq.max).map(function(i){ return '<div class="mc" data-i="'+i+'" style="'+cellStyle+'color:#1B1530;cursor:pointer;font-size:'+(opts.fs?opts.fs*1.6:44)+'px">'+(i+1)+'</div>'; }).join('') + '</div>'; if (opts.onPhase) opts.onPhase('go'); }
        return;
      }
    }

    el.addEventListener('pointerdown', function(ev){
      if (done || !opts.onDone) return;
      var c = ev.target.closest ? ev.target.closest('.mc') : null; if (!c) return;
      var i = +c.getAttribute('data-i'), now = Date.now();
      if (type==='memory'){
        if (shown!=='ginput') return;
        if (i===seq.order[p]){ setCell(i,'#2DD4BF'); setTimeout(function(){ setCell(i,'#fff'); },160); p++;
          if (p>=seq.order.length){ done = true; opts.onDone({ ok:true, rt: now - (startAt + 400 + seq.order.length*seq.step + 300) }); }
        } else { setCell(i,'#FF5D8F'); done = true; opts.onDone({ ok:false, rt:0, p:p, len:seq.order.length }); }
      } else if (type==='tapnum'){
        if (shown!=='go') return;
        var nv = +c.getAttribute('data-n'); if (!nv) return;
        if (nv===next){ c.style.background = '#2DD4BF'; c.style.color = '#12102a'; next++; if (next>seq.n){ done = true; opts.onDone({ ok:true, rt: now-startAt }); } }
        else { c.style.background = '#FF5D8F'; setTimeout(function(){ if (c.style.background.indexOf('45, 212')<0) c.style.background = '#fff'; },200); }
      } else if (type==='cardpos'){
        if (shown!=='ask') return; done = true; opts.onDone({ ok:i===seq.ask, rt: now - (startAt + seq.showMs) });
      } else if (type==='nunchi'){
        if (shown!=='go') return; done = true; c.style.background = '#FFC24B'; c.style.color = '#12102a'; opts.onDone({ value:i+1 });
      }
    });
    var t = setInterval(function(){ if (stopped){ clearInterval(t); return; } render(Date.now()); }, 40); render(Date.now());
    return { stop:function(){ stopped = true; clearInterval(t); } };
  }
  window.TQMini = { make:make, mount:mount, totalMs:totalMs };
})();
