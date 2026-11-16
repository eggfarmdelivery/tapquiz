/* 탭퀴즈 액션형 게임 모음 (host.html / player.html 공용)
 * 리듬 탭 · 50m 달리기 · 탭탭이 뽑기 · 풍선 다트 · 단체 줄넘기 · 풍선 불기 · 팀 줄다리기
 * 분위기형 게임과 같은 통신 방식을 써요 (TQParty.games / TQParty.phone). 스키마 변경 없음.
 *  - 방장: ctx.set({phase:'play', seed, run, ...}) 으로 시작을 알리고, ctx.inputs() 로 각자 기록을 읽어 큰 화면에 그려요.
 *  - 휴대폰: 받은 seed 로 같은 게임판을 만들어 혼자 진행하고, 1초마다 ctx.send({...}) 로 기록을 보내요.
 */
(function(){
  'use strict';
  var P = window.TQParty; if(!P) return;
  var esc = P.esc;
  var META = {
    rhythm:{ ko:'리듬 탭', icon:'🥁', dur:24, unit:'점', how:['빨강·파랑 동그라미가 오른쪽에서 흘러와요','세로선에 닿는 순간 같은 색 버튼을 눌러요','정확할수록 높은 점수! (퍼펙트 > 굿)'] },
    run:{ ko:'50m 달리기', icon:'🏃', dur:40, unit:'m', how:['탭탭이가 저절로 달려요','◀ ▶ 버튼으로 옆으로 피해요 (두 번 누르면 두 칸)','장애물에 걸리면 잠깐 어질어질! 50m에 먼저 도착하면 1등'] },
    claw:{ ko:'탭탭이 뽑기', icon:'🕹️', dur:28, unit:'점', how:['집게가 좌우로 저절로 움직여요','"잡기!"를 누르면 그 자리에서 내려가요','작은 탭탭이일수록 높은 점수! 3번 뽑은 합계로 겨뤄요'] },
    dart:{ ko:'풍선 다트', icon:'🎯', dur:20, unit:'개', how:['먼저 가로 위치를 눌러서 정해요','이어서 세로 위치를 누르면 다트가 날아가요','20초 동안 풍선을 가장 많이 터뜨린 사람이 1등'] },
    rope:{ ko:'단체 줄넘기', icon:'🪢', dur:34, unit:'번', how:['줄이 발밑에 올 때 "점프!"를 눌러요','줄이 점점 빨라져요','걸리면 탈락! 가장 오래 버틴 사람이 1등'] },
    pump:{ ko:'풍선 불기', icon:'🎈', dur:27, unit:'점', how:['"불기!"를 누를수록 풍선이 커지고 점수가 올라요','언제 터질지 몰라요! 터지면 그 풍선은 0점','터지기 전에 "그만!"을 눌러 점수를 챙겨요 (풍선 3개)'] },
    tug:{ ko:'팀 줄다리기', icon:'🤼', dur:20, unit:'번', how:['두 팀으로 나눠서 겨뤄요 (개인전이면 자동으로 반반 나눠요)','우리 팀이 다 같이 "당겨!"를 연타해요','깃발을 우리 쪽으로 끝까지 끌어오면 승리!'] }
  };
  Object.keys(META).forEach(function(k){ P.META[k] = { ko:META[k].ko, icon:META[k].icon }; });
  P.ACTION = Object.keys(META); P.ACTION_META = META;

  function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s){ var h = 7; s = String(s); for(var i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0; return h; }
  function jimg(av, team, expr){ var im = new Image(); try{ im.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(Jelly.svg(av, team, expr).replace('<svg ', '<svg width="102" height="126" ')); }catch(e){} return im; }
  function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms||20); }catch(e){} }
  var INK = '#1B1530', RED = '#FF5D5D', BLUE = '#4D8BFF', PINK = '#FF5D8F', MINT = '#2DD4BF', GOLD = '#FFC24B';
  function txt(c, s, x, y, size, col, align, stroke){ c.font = '900 '+size+'px "Noto Sans KR",sans-serif'; c.textAlign = align||'center'; c.textBaseline = 'middle'; if(stroke){ c.lineWidth = 4; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(s, x, y); } c.fillStyle = col||INK; c.fillText(s, x, y); }
  function circ(c, x, y, r, fill, lw){ c.beginPath(); c.arc(x, y, r, 0, 7); if(fill){ c.fillStyle = fill; c.fill(); } if(lw!==0){ c.lineWidth = lw||3; c.strokeStyle = INK; c.stroke(); } }
  function avDraw(c, im, cx, by, w){ if(im && im.complete && im.naturalWidth) c.drawImage(im, cx-w/2, by-w*1.2, w, w*1.235); else circ(c, cx, by-w*0.5, w*0.4, MINT); }

  /* ══════════════ 게임 규칙 (휴대폰에서 혼자 진행) ══════════════
   * init(rand, env) → g,  press(g, i, t),  step(g, t, dt),  draw(c, g, t, W, H, env),  rep(g) → 보낼 기록,  over(g, t) */
  var G = {};

  /* 🥁 리듬 탭 */
  G.rhythm = { btns:[['빨강', RED], ['파랑', BLUE]],
    init:function(rand){ var notes = [], h = 1.6, N = 20; for(var i=0;i<N;i++){ notes.push({ h:h, c:rand()<0.5?0:1, d:Math.max(0.95, 1.7-0.04*i), j:null }); h += Math.max(0.5, 0.95-0.025*i); } return { notes:notes, pts:0, combo:0, maxc:0, fb:null, pf:0, gd:0, ms:0 }; },
    judge:function(g, n, j, t){ n.j = j; if(j==='p'){ g.pts += 10; g.combo++; g.pf++; } else if(j==='g'){ g.pts += 5; g.combo++; g.gd++; } else { g.combo = 0; g.ms++; } g.maxc = Math.max(g.maxc, g.combo); g.fb = { j:j, t:t }; },
    press:function(g, i, t){ var n = null; for(var k=0;k<g.notes.length;k++){ var x = g.notes[k]; if(x.j===null && Math.abs(t-x.h) < 0.24){ n = x; break; } } if(!n) return;
      if(n.c !== i) return this.judge(g, n, 'm', t); var e = Math.abs(t-n.h); this.judge(g, n, e<0.09?'p':'g', t); if(e<0.09) buzz(15); },
    step:function(g, t){ var self = this; g.notes.forEach(function(n){ if(n.j===null && t > n.h+0.24) self.judge(g, n, 'm', t); }); },
    score:function(g){ return Math.round(g.pts/(g.notes.length*10)*100); },
    draw:function(c, g, t, W, H){ var ly = H*0.3, lh = 78, lx = 62;
      txt(c, '색이 같은 버튼을 눌러요!', W/2, ly-26, 15); c.fillStyle = '#fff'; c.fillRect(0, ly, W, lh); c.fillStyle = INK; c.fillRect(0, ly-4, W, 4); c.fillRect(0, ly+lh, W, 4);
      c.setLineDash([6,6]); circ(c, lx, ly+lh/2, 28, null, 3); c.setLineDash([]); c.fillRect(lx-3, ly-14, 6, lh+28);
      g.notes.forEach(function(n){ if(n.j==='p'||n.j==='g') return; var x = lx + (W+40-lx)*(n.h-t)/n.d; if(x>W+40 || x<-40) return; c.globalAlpha = n.j==='m'?0.3:1; circ(c, x, ly+lh/2, 25, n.c?BLUE:RED, 4); c.globalAlpha = 1; });
      if(g.fb && t-g.fb.t < 0.6){ var m = { p:['퍼펙트!', MINT], g:['굿!', GOLD], m:['미스', '#9A94B5'] }[g.fb.j]; c.globalAlpha = 1-(t-g.fb.t)/0.7; txt(c, m[0], W/2, ly+lh+50, 38, m[1], 'center', true); c.globalAlpha = 1; }
      if(g.combo>1) txt(c, '🔥 '+g.combo+' 콤보', W/2, ly+lh+92, 16);
      txt(c, this.score(g)+'점', W-12, 18, 20, PINK, 'right', true); },
    rep:function(g){ return { s:this.score(g) }; },
    over:function(g, t){ return t > g.notes[g.notes.length-1].h + 1.0; },
    end:function(g){ return ['리듬 완료!', this.score(g)+'점', '퍼펙트 '+g.pf+' · 굿 '+g.gd+' · 미스 '+g.ms]; } };

  /* 🏃 50m 달리기 */
  var OBS = ['🪨','🦅','🧱','🌵'], GOAL = 50;
  G.run = { btns:[['◀', RED], ['▶', BLUE]],
    init:function(rand){ var rows = {}; for(var m=5;m<GOAL-1;m+=2){ var lanes = [0,1,2,3,4], k = 1+Math.floor(rand()*3), o = {}; for(var j=0;j<k;j++){ var l = lanes.splice(Math.floor(rand()*lanes.length),1)[0]; o[l] = OBS[Math.floor(rand()*4)]; } rows[m] = o; } return { rows:rows, lane:2, x:2, d:0, stun:0, hit:{}, fin:null }; },
    press:function(g, i){ if(g.stun>0 || g.fin!=null) return; g.lane = Math.max(0, Math.min(4, g.lane + (i?1:-1))); },
    step:function(g, t, dt){ g.x += (g.lane-g.x)*Math.min(1, dt*18); if(g.fin!=null) return; if(g.stun>0){ g.stun -= dt; return; }
      g.d += (2.3+0.07*t)*dt; var m = Math.round(g.d+0.35); if(g.rows[m] && !g.hit[m] && g.d >= m-0.45 && g.rows[m][g.lane]!==undefined){ g.hit[m] = 1; g.stun = 0.8; buzz([60,40,60]); }
      if(g.d >= GOAL){ g.d = GOAL; g.fin = Math.round(t*10)/10; } },
    draw:function(c, g, t, W, H, env){ var lw = W/5, FH = 62, base = H-70; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
      for(var m=Math.floor(g.d)-2; m<=Math.floor(g.d)+Math.ceil(H/FH)+1; m++){ if(m<0 || m>GOAL+2) continue; var y = base-(m-g.d)*FH; c.fillStyle = m%2?'#fff':'#FBF6E9'; c.fillRect(0, y-FH/2, W, FH);
        if(m===GOAL){ for(var q=0;q<W;q+=14){ c.fillStyle = (q/14)%2?'#fff':INK; c.fillRect(q, y-7, 14, 14); } }
        txt(c, m+'m', 4, y-FH/2+9, 10, '#B9B2CC', 'left'); var o = g.rows[m]; if(o) Object.keys(o).forEach(function(l){ c.globalAlpha = g.hit[m]&&+l===g.lane?0.3:1; c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o[l], (+l+0.5)*lw, y); c.globalAlpha = 1; }); }
      c.strokeStyle = '#EEE7D6'; c.lineWidth = 2; for(var k=1;k<5;k++){ c.beginPath(); c.moveTo(k*lw, 0); c.lineTo(k*lw, H); c.stroke(); }
      var cx = (g.x+0.5)*lw; c.save(); c.translate(cx, base+26); if(g.stun>0) c.rotate(Math.sin(t*26)*0.25); avDraw(c, g.stun>0?env.meS:env.me, 0, 0, 50); c.restore();
      if(g.stun>0){ c.font = '24px sans-serif'; c.textAlign = 'center'; c.fillText('💫', cx, base-40); txt(c, '어질어질~', W/2, H*0.36, 30, GOLD, 'center', true); }
      txt(c, Math.floor(g.d)+'m', 10, 20, 24, PINK, 'left', true); txt(c, (g.fin!=null?g.fin:t).toFixed(1)+'초', W-10, 20, 16, INK, 'right'); },
    rep:function(g){ return { d:Math.round(g.d*10)/10, f:g.fin }; },
    over:function(g, t){ return g.fin!=null || t > 38; },
    end:function(g){ return g.fin!=null ? ['결승선 통과!', g.fin.toFixed(1)+'초', '순위는 큰 화면에서 확인해요'] : ['시간 끝!', Math.floor(g.d)+'m', '']; } };

  /* 🕹️ 탭탭이 뽑기 */
  var DOLL = [{ sz:64, pt:10, av:'1,3' }, { sz:30, pt:100, av:'7,4' }, { sz:52, pt:30, av:'5,1' }, { sz:38, pt:80, av:'2,2' }, { sz:46, pt:50, av:'4,0' }];
  G.claw = { btns:[['잡기!', PINK]],
    init:function(rand, env){ var tries = []; for(var k=0;k<3;k++){ var sl = [0,1,2,3,4]; for(var i=4;i>0;i--){ var j = Math.floor(rand()*(i+1)), tt = sl[i]; sl[i] = sl[j]; sl[j] = tt; } tries.push({ slot:sl, ph:rand()*6 }); }
      env.dolls = DOLL.map(function(d){ return jimg(d.av); }); return { tries:tries, k:0, ph:'osc', u:0, x:150, y:0, got:null, total:0, log:[] }; },
    cx:function(g, W){ var tr = g.tries[g.k]; return W/2 + (W/2-34)*Math.sin((1.9+0.7*g.k)*g.u + tr.ph); },
    press:function(g){ if(g.ph==='osc' && g.u>0.3){ g.ph = 'drop'; g.u = 0; buzz(20); } },
    step:function(g, t, dt, W){ if(g.k>=3) return; g.u += dt; var tr = g.tries[g.k];
      if(g.ph==='osc'){ g.x = this.cx(g, W); if(g.u>7){ g.ph = 'drop'; g.u = 0; } }
      else if(g.ph==='drop' && g.u>=0.5){ g.got = null; for(var i=0;i<5;i++){ var dx = (tr.slot[i]+0.5)*(W/5); if(Math.abs(g.x-dx) < DOLL[i].sz*0.42){ g.got = i; } } g.ph = 'rise'; g.u = 0; if(g.got!=null) buzz(40); }
      else if(g.ph==='rise' && g.u>=0.6){ g.ph = 'show'; g.u = 0; var pt = g.got!=null?DOLL[g.got].pt:0; g.total += pt; g.log.push(pt); }
      else if(g.ph==='show' && g.u>=1.0){ g.k++; g.ph = 'osc'; g.u = 0; g.got = null; } },
    draw:function(c, g, t, W, H, env){ var top = 44, fl = H-30, k = Math.min(2, g.k), tr = g.tries[k]; c.fillStyle = '#E9F7FF'; c.fillRect(0, top, W, H-top); c.fillStyle = INK; c.fillRect(0, top+10, W, 8); c.fillStyle = GOLD; c.fillRect(0, fl, W, 30); c.fillStyle = INK; c.fillRect(0, fl-4, W, 4);
      var depth = fl-top-18-70, yy = g.ph==='drop'?depth*Math.min(1, g.u/0.5):g.ph==='rise'?depth*(1-Math.min(1, g.u/0.6)):0, hy = top+18+yy;
      for(var i=0;i<5;i++){ if(g.got===i && (g.ph==='rise'||g.ph==='show')) continue; var d = DOLL[i], dx = (tr.slot[i]+0.5)*(W/5); avDraw(c, env.dolls[i], dx, fl-6, d.sz); txt(c, d.pt+'점', dx, fl+14, 11); }
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(g.x, top+18); c.lineTo(g.x, hy+6); c.stroke();
      var open = !(g.ph==='rise' || (g.ph==='show' && g.got!=null)), a = open?0.5:0.12; c.lineWidth = 5; c.lineCap = 'round'; c.fillStyle = INK; c.fillRect(g.x-10, hy, 20, 11);
      [-1,1].forEach(function(s){ c.beginPath(); c.moveTo(g.x+s*7, hy+10); c.lineTo(g.x+s*(7+Math.sin(a)*22), hy+10+Math.cos(a)*16); c.lineTo(g.x+s*(7+Math.sin(a)*22-6), hy+34); c.stroke(); });
      if(g.got!=null && (g.ph==='rise'||g.ph==='show')) avDraw(c, env.dolls[g.got], g.x, hy+30+DOLL[g.got].sz*1.1, DOLL[g.got].sz);
      if(g.ph==='show') txt(c, g.got!=null?'+'+DOLL[g.got].pt+'점!':'아쉬워요! 꽝', W/2, H*0.45, 34, g.got!=null?MINT:'#9A94B5', 'center', true);
      txt(c, (k+1)+' / 3번째', 10, 20, 15, INK, 'left'); txt(c, g.total+'점', W-10, 20, 22, PINK, 'right', true); },
    rep:function(g){ return { s:g.total, k:g.k }; },
    over:function(g){ return g.k>=3; },
    end:function(g){ return ['뽑기 끝!', g.total+'점', g.log.map(function(p){ return p?'+'+p:'꽝'; }).join(' · ')]; } };

  /* 🎯 풍선 다트 */
  var BCOL = ['#FF7A7A','#FFB84D','#6EE7A0','#7AA2FF','#B388FF'];
  G.dart = { btns:[['누르기!', PINK]],
    init:function(rand){ var b = []; for(var i=0;i<25;i++) b.push(1); return { b:b, ph:'x', u:0, lx:0, ly:0, n:0, th:0, p0:rand()*6, last:null, pops:[] }; },
    geo:function(W, H){ var S = Math.min(W-20, H-80); return { S:S, ox:(W-S)/2, oy:38, cell:S/5 }; },
    sw:function(g, S, ax){ var w = Math.min(7.5, 3.2+0.3*g.th)*(ax?1.12:1); return S/2 + (S/2-6)*Math.sin(w*g.u + g.p0 + (ax?0.9:0) + g.th*1.7); },
    press:function(g){ if(g.u<0.18) return; if(g.ph==='x'){ g.lx = g.cx; g.ph = 'y'; g.u = 0; buzz(15); } else if(g.ph==='y'){ g.ly = g.cy; g.ph = 'fly'; g.u = 0; buzz(15); } },
    step:function(g, t, dt, W, H){ var q = this.geo(W, H); g.u += dt; if(t >= 20 && g.ph!=='fly' && g.ph!=='show'){ g.ph = 'end'; return; }
      if(g.ph==='x') g.cx = this.sw(g, q.S, 0); else if(g.ph==='y') g.cy = this.sw(g, q.S, 1);
      else if(g.ph==='fly' && g.u>=0.25){ var col = Math.floor(g.lx/q.cell), row = Math.floor(g.ly/q.cell), ok = false; if(col>=0&&col<5&&row>=0&&row<5 && g.b[row*5+col] && Math.hypot(g.lx-(col+0.5)*q.cell, g.ly-(row+0.5)*q.cell) < q.cell*0.4){ g.b[row*5+col] = 0; g.n++; ok = true; g.pops.push({ i:row*5+col, t:t }); buzz(50); }
        g.last = ok; g.th++; g.ph = 'show'; g.u = 0; if(g.b.every(function(v){ return !v; })) for(var i=0;i<25;i++) g.b[i] = 1; }
      else if(g.ph==='show' && g.u>=0.4){ g.ph = t>=20?'end':'x'; g.u = 0; } },
    draw:function(c, g, t, W, H){ var q = this.geo(W, H), S = q.S; c.save(); c.translate(q.ox, q.oy); c.fillStyle = '#fff'; c.fillRect(0, 0, S, S); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(0, 0, S, S);
      for(var i=0;i<25;i++){ var x = (i%5+0.5)*q.cell, y = (Math.floor(i/5)+0.5)*q.cell; if(g.b[i]){ c.beginPath(); c.ellipse(x, y-2, q.cell*0.33, q.cell*0.38, 0, 0, 7); c.fillStyle = BCOL[(Math.floor(i/5)+(i%5)*2)%5]; c.fill(); c.lineWidth = 3; c.stroke(); } else { c.setLineDash([4,4]); c.lineWidth = 1.5; c.strokeStyle = '#ddd'; c.beginPath(); c.arc(x, y, q.cell*0.3, 0, 7); c.stroke(); c.setLineDash([]); c.strokeStyle = INK; } }
      g.pops.forEach(function(p){ if(t-p.t < 0.45){ c.globalAlpha = 1-(t-p.t)/0.45; c.font = (q.cell*0.9)+'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💥', (p.i%5+0.5)*q.cell, (Math.floor(p.i/5)+0.5)*q.cell); c.globalAlpha = 1; } });
      if(g.ph==='x'){ c.fillStyle = PINK; c.fillRect(g.cx-2, 0, 4, S); } else if(g.ph!=='end'){ c.globalAlpha = g.ph==='y'?0.45:0.3; c.fillStyle = PINK; c.fillRect(g.lx-2, 0, 4, S); c.globalAlpha = g.ph==='y'?1:0.3; c.fillStyle = BLUE; c.fillRect(0, (g.ph==='y'?g.cy:g.ly)-2, S, 4); c.globalAlpha = 1; if(g.ph!=='y') circ(c, g.lx, g.ly, 7, '#fff', 3); }
      if(g.ph==='show') txt(c, g.last?'펑!':'빗나갔어요', S/2, S/2, 32, g.last?MINT:'#9A94B5', 'center', true);
      c.restore();
      txt(c, g.ph==='x'?'① 가로 맞추기':g.ph==='y'?'② 세로 맞추기':'', W/2, q.oy+S+22, 16, g.ph==='x'?PINK:BLUE);
      txt(c, '🎈 '+g.n+'개', 10, 18, 20, PINK, 'left', true); txt(c, Math.max(0, Math.ceil(20-t))+'초', W-10, 18, 16, INK, 'right'); },
    rep:function(g){ return { s:g.n }; },
    over:function(g){ return g.ph==='end'; },
    end:function(g){ return ['시간 끝!', '🎈 '+g.n+'개', g.th+'번 던졌어요']; } };

  /* 🪢 단체 줄넘기 */
  var ROPE = (function(){ var a = [], t = 1.8; for(var k=0;k<40;k++){ a.push(t); t += Math.max(0.55, 1.25-0.035*k); } return a; })();
  G.rope = { btns:[['점프!', PINK]],
    init:function(){ return { jt:-9, n:0, out:null, k:0, ok:-9 }; },
    press:function(g, i, t){ if(g.out==null && t-g.jt > 0.46){ g.jt = t; buzz(15); } },
    step:function(g, t){ if(g.out!=null || g.k>=ROPE.length) return; var p = ROPE[g.k]; if(t >= p){ if(g.jt <= p && p <= g.jt+0.46){ g.n++; g.ok = t; g.k++; } else { g.out = t; buzz([200,60,200]); } } },
    th:function(t){ if(t<ROPE[0]) return Math.PI*(t/ROPE[0]); for(var k=1;k<ROPE.length;k++) if(t<ROPE[k]) return Math.PI + 2*Math.PI*((t-ROPE[k-1])/(ROPE[k]-ROPE[k-1])); return Math.PI; },
    draw:function(c, g, t, W, H, env){ var gy = H-46, th = this.th(g.out!=null?g.out:t), co = Math.cos(th), A = Math.min(250, H-110); c.fillStyle = '#DDF3FF'; c.fillRect(0, 0, W, gy); c.fillStyle = '#B9E4A6'; c.fillRect(0, gy, W, H-gy);
      var rope = function(){ c.beginPath(); c.moveTo(22, gy-A/2); c.quadraticCurveTo(W/2, gy-A/2-co*A, W-22, gy-A/2); c.lineWidth = 6; c.strokeStyle = '#C0392B'; c.lineCap = 'round'; c.stroke(); };
      var back = Math.sin(th) >= 0; if(back){ c.globalAlpha = 0.5; rope(); c.globalAlpha = 1; }
      c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🧍', 20, gy-A/2+10); c.fillText('🧍', W-20, gy-A/2+10);
      var u = t-g.jt, jy = (g.out==null && u>0 && u<0.46) ? Math.sin(u/0.46*Math.PI)*70 : 0; c.save(); c.translate(W/2, gy+4-jy); if(g.out!=null) c.rotate(Math.min(1.4, (t-g.out)*7)); avDraw(c, g.out!=null?env.meS:env.me, 0, 0, 82); c.restore();
      if(!back) rope();
      if(g.out!=null) txt(c, '앗! 걸렸어요', W/2, 70, 32, RED, 'center', true); else if(t-g.ok < 0.4) txt(c, g.n+'번 성공!', W/2, 70, 28, MINT, 'center', true);
      txt(c, g.n+'번', 10, 20, 26, PINK, 'left', true); },
    rep:function(g){ return { n:g.n, o:g.out!=null?1:0 }; },
    over:function(g, t){ return (g.out!=null && t > g.out+1.3) || g.k>=ROPE.length; },
    end:function(g){ return [g.out!=null?'걸렸어요!':'끝까지 버텼어요!', g.n+'번', '남은 사람들을 응원해요']; } };

  /* 🎈 풍선 불기 */
  G.pump = { btns:[['불기!', PINK], ['그만!', MINT]],
    init:function(rand, env){ var r = mulberry((env.seed||1) ^ hashStr(env.id||'x')), thr = []; for(var i=0;i<3;i++) thr.push(6+Math.floor(r()*12)); return { thr:thr, k:0, p:0, ph:'play', u:0, total:0, res:null, log:[] }; },
    bank:function(g, burst){ var pt = burst?0:g.p*5; g.total += pt; g.res = burst?'b':pt; g.log.push(burst?'펑':'+'+pt); g.ph = 'show'; g.u = 0; },
    press:function(g, i){ if(g.ph!=='play' || g.k>=3) return; if(i===0){ g.p++; buzz(12); if(g.p >= g.thr[g.k]){ buzz([150,50,150]); this.bank(g, true); } } else if(g.p>0) this.bank(g, false); },
    step:function(g, t, dt){ if(g.k>=3) return; g.u += dt; if(g.ph==='play' && g.u>8) this.bank(g, false); else if(g.ph==='show' && g.u>=1.1){ g.k++; g.p = 0; g.ph = 'play'; g.u = 0; } },
    draw:function(c, g, t, W, H){ c.fillStyle = '#fff'; c.fillRect(0, 40, W, H-40); var cx = W/2, cy = 40+(H-40)*0.46;
      if(g.ph==='show'){ if(g.res==='b'){ c.font = '110px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💥', cx, cy-20); txt(c, '펑! 0점', cx, cy+70, 34, RED, 'center', true); } else { c.font = '70px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✅', cx, cy-30); txt(c, '+'+g.res+'점 획득!', cx, cy+50, 34, MINT, 'center', true); } }
      else if(g.k<3){ var r = Math.min(Math.min(W, H-40)*0.44, 28+g.p*5.5), dg = g.p>=9; c.save(); c.translate(cx + (dg?Math.sin(t*40)*2:0), cy); c.beginPath(); c.ellipse(0, 0, r, r*1.14, 0, 0, 7); c.fillStyle = dg?RED:'#FF8FD0'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.globalAlpha = 0.45; c.beginPath(); c.ellipse(-r*0.35, -r*0.45, r*0.16, r*0.24, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1; c.restore();
        txt(c, '지금 '+(g.p*5)+'점'+(dg?' · 위험!':''), cx, H-26, 24, dg?RED:GOLD, 'center', true); txt(c, Math.max(0, Math.ceil(8-g.u))+'초', W-10, 62, 14, INK, 'right'); }
      txt(c, Math.min(3, g.k+1)+' / 3번째 풍선', 10, 20, 15, INK, 'left'); txt(c, g.total+'점', W-10, 20, 22, PINK, 'right', true); },
    rep:function(g){ return { s:g.total, k:g.k, p:g.ph==='play'?g.p:0, b:g.ph==='show'&&g.res==='b'?1:0 }; },
    over:function(g){ return g.k>=3; },
    end:function(g){ return ['풍선 불기 끝!', g.total+'점', g.log.join(' · ')]; } };

  /* 🤼 팀 줄다리기 (줄 위치 x 는 방장이 계산해서 알려줘요: -100 = A팀 승리, +100 = B팀 승리) */
  G.tug = { btns:[['당겨!', MINT]],
    init:function(rand, env){ return { n:0, x:0, tx:0, team:env.team||'A', last:0 }; },
    press:function(g, i, t){ g.n++; g.last = t; buzz(8); },
    step:function(g, t, dt){ g.x += (g.tx-g.x)*Math.min(1, dt*4); },
    draw:function(c, g, t, W, H, env){ var A = g.team==='A', col = A?MINT:PINK, sx = A?g.x:-g.x; c.fillStyle = '#fff'; c.fillRect(0, 44, W, 140); c.fillStyle = '#8B5A2B'; c.fillRect(12, 110, W-24, 8);
      c.setLineDash([6,6]); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(W/2, 70); c.lineTo(W/2, 160); c.stroke(); c.setLineDash([]);
      c.font = '28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚩', W/2 + sx*(W/2-30)/100, 98);
      txt(c, '◀ 우리 팀', 10, 60, 14, col, 'left'); txt(c, '상대 팀 ▶', W-10, 60, 14, '#9A94B5', 'right'); txt(c, sx<-8?'이기고 있어요!':sx>8?'밀리고 있어요! 더 빨리!':'팽팽해요!', W/2, 168, 15);
      c.save(); c.translate(W/2, H-40); c.rotate(t-g.last<0.15?-0.25:-0.08); avDraw(c, env.me, 0, 0, 88); c.restore(); txt(c, g.n+'번', W/2, 214, 30, GOLD, 'center', true);
      txt(c, '나는 '+g.team+'팀', 10, 20, 16, col, 'left'); txt(c, Math.max(0, Math.ceil(20-t))+'초', W-10, 20, 16, INK, 'right'); },
    rep:function(g){ return { n:g.n }; },
    over:function(g, t){ return t > 21; },
    end:function(g){ return ['끝!', g.n+'번 당겼어요', '결과는 큰 화면에서 확인해요']; } };

  /* ══════════════ 휴대폰 화면 ══════════════ */
  function phone(type){ return function(ctx, st){
    var S = ctx.S, M = META[type], def = G[type];
    var fz = document.getElementById('fzBtn');
    var stopLoop = function(){ if(S.actRaf){ cancelAnimationFrame(S.actRaf); S.actRaf = null; } S.actKey = null; if(fz) fz.style.display = ''; };
    if(!st || st.phase!=='play'){ stopLoop();
      var msg = st && st.phase==='end' ? ['끝났어요!', '결과를 모으고 있어요'] : [M.icon+' '+M.ko, '방장이 곧 시작해요'];
      ctx.app.innerHTML = ctx.header(ctx.cur)+'<div class="center"><div class="big">'+esc(msg[0])+'</div><div class="m-sway">'+ctx.avHTML(S.me.avatar, S.me.team, 120)+'</div><div class="muted">'+esc(msg[1])+'</div>'
        +(type==='tug' && st && st.phase!=='end' && st.teams && st.teams[S.me.id] ? '<div class="big" style="font-size:26px;padding:6px 22px;border-radius:999px;border:3px solid var(--ink);color:#fff;background:'+(st.teams[S.me.id]==='A'?'#2DD4BF':'#FF5D8F')+'">나는 '+st.teams[S.me.id]+'팀</div>' : '')
        +(st && st.phase!=='end' ? '<div style="text-align:left;font-size:14px;line-height:1.7;background:#fff;border:3px solid var(--ink);border-radius:14px;padding:10px 14px">'+M.how.map(function(h, i){ return (i+1)+'. '+esc(h); }).join('<br>')+'</div>' : '')+'</div>';
      return; }
    var key = ctx.cur.id+':'+st.run;
    if(S.actKey === key){ if(S.actG && type==='tug' && typeof st.x==='number') S.actG.tx = st.x; return; }   // 같은 판이 이미 진행 중이면 다시 그리지 않아요
    stopLoop(); S.actKey = key; if(fz) fz.style.display = 'none';   // 게임 버튼을 가리지 않게 글씨 크기 버튼을 잠시 숨겨요
    var team = (st.teams && st.teams[S.me.id]) || S.me.team || null;
    var env = { me:jimg(S.me.avatar, team), meS:jimg(S.me.avatar, team, 'surprise'), seed:st.seed, id:S.me.id, team:team };
    var g = def.init(mulberry(st.seed||1), env); S.actG = g; if(type==='tug' && typeof st.x==='number') g.tx = st.x;
    ctx.app.innerHTML = ctx.header(ctx.cur)
      +'<div style="flex:1;display:flex;flex-direction:column;gap:10px;min-height:0"><div id="acWrap" style="flex:1;min-height:240px;border:3px solid var(--ink);border-radius:16px;overflow:hidden;background:#FFF0C9;position:relative"><canvas id="acCv" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas></div>'
      +'<div id="acBtns" style="display:flex;gap:10px">'+def.btns.map(function(b, i){ return '<button type="button" data-i="'+i+'" style="flex:'+(type==='pump'&&i===1?'0.6':'1')+';height:96px;border-radius:48px;font-size:26px;font-family:var(--display);color:#fff;background:'+b[1]+';border:4px solid var(--ink);box-shadow:0 7px 0 var(--ink);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent">'+b[0]+'</button>'; }).join('')+'</div></div>';
    var cv = ctx.app.querySelector('#acCv'), wrap = ctx.app.querySelector('#acWrap'), c = cv.getContext('2d'), W = 300, H = 340, dpr = Math.min(2, window.devicePixelRatio||1);
    var fit = function(){ var r = wrap.getBoundingClientRect(); if(r.width<10) return; H = Math.max(220, Math.round(W*r.height/r.width)); cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); };
    fit();
    var t0 = performance.now()+3000, last = t0, lastSend = 0, lastRep = '', ended = false, endInfo = null;
    var now = function(){ return (performance.now()-t0)/1000; };
    ctx.app.querySelectorAll('#acBtns button').forEach(function(b){ b.addEventListener('pointerdown', function(e){ e.preventDefault(); var t = now(); if(t<0 || ended || S.actKey!==key) return; def.press(g, +b.dataset.i, t, W, H); b.style.transform = 'translateY(5px)'; b.style.boxShadow = '0 2px 0 var(--ink)'; setTimeout(function(){ b.style.transform = ''; b.style.boxShadow = '0 7px 0 var(--ink)'; }, 90); }); });
    var send = function(fin){ var o = def.rep(g); if(fin) o.fin = 1; var s = JSON.stringify(o); if(s===lastRep && !fin) return; lastRep = s; ctx.send(o); };
    var frame = function(){
      if(S.actKey!==key || !document.body.contains(cv)){ if(S.actKey===key) S.actKey = null; if(fz && !document.getElementById('acCv')) fz.style.display = ''; return; }
      var pn = performance.now(), t = (pn-t0)/1000, dt = Math.min(0.1, (pn-last)/1000); last = pn;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      if(t < 0){ def.draw(c, g, 0, W, H, env); c.fillStyle = 'rgba(255,240,201,.6)'; c.fillRect(0, 0, W, H); txt(c, String(Math.ceil(-t)), W/2, H/2, 120, PINK, 'center', true); }
      else if(!ended){ def.step(g, t, dt, W, H); def.draw(c, g, t, W, H, env);
        if(pn-lastSend > 1000){ lastSend = pn; send(false); }
        if(def.over(g, t)){ ended = true; endInfo = def.end(g); send(true); ctx.app.querySelectorAll('#acBtns button').forEach(function(b){ b.disabled = true; b.style.opacity = .4; }); } }
      else { c.fillStyle = '#FFF0C9'; c.fillRect(0, 0, W, H); txt(c, M.icon, W/2, H*0.24, 56); txt(c, endInfo[0], W/2, H*0.42, 22, '#0AA593'); txt(c, endInfo[1], W/2, H*0.58, 50, PINK, 'center', true); txt(c, endInfo[2], W/2, H*0.74, 14, '#6B6585'); txt(c, '큰 화면에서 순위를 확인해요', W/2, H*0.86, 13, '#6B6585'); }
      S.actRaf = requestAnimationFrame(frame);
    };
    S.actRaf = requestAnimationFrame(frame);
  }; }

  /* ══════════════ 방장(큰 화면) ══════════════ */
  function metric(type, v){ if(!v) return null; if(type==='run') return v.f!=null ? 1000-v.f : (v.d||0); if(type==='rope'||type==='tug') return v.n||0; return v.s||0; }
  function label(type, v){ if(!v) return '-'; if(type==='run') return v.f!=null ? v.f.toFixed(1)+'초' : Math.floor(v.d||0)+'m'; if(type==='rope') return (v.n||0)+'번'; if(type==='tug') return (v.n||0)+'번'; if(type==='dart') return (v.s||0)+'개'; return (v.s||0)+'점'; }
  function ranked(type, players, inp){ return players.map(function(p){ return { p:p, v:inp[p.id], m:metric(type, inp[p.id]) }; }).sort(function(a, b){ return (b.m==null?-1:b.m)-(a.m==null?-1:a.m) || a.p.join_order-b.p.join_order; }); }
  function boardHTML(type, rows, n){ var mx = Math.max.apply(null, rows.map(function(r){ return type==='run'?GOAL:(r.m||0); }).concat([1]));
    return rows.slice(0, n).map(function(r, i){ var val = type==='run' ? (r.v ? (r.v.f!=null?GOAL:(r.v.d||0)) : 0) : (r.m||0);
      return '<div style="display:flex;align-items:center;gap:10px;background:#fff;border:3px solid var(--ink);border-radius:12px;padding:4px 12px;font-weight:800;font-size:17px"><span style="width:22px">'+(i+1)+'</span><span style="width:34px;flex:none">'+Jelly.svg(r.p.avatar, r.p.team)+'</span><span style="width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.p.nickname)+'</span><span style="flex:1;min-width:0"><span style="display:block;height:16px;border-radius:8px;border:2px solid var(--ink);background:var(--coral);width:'+Math.max(3, val/mx*100)+'%;transition:width .6s"></span></span><span style="width:70px;text-align:right">'+label(type, r.v)+'</span></div>'; }).join(''); }

  function host(type){ return function(ctx){
    var M = META[type], players = ctx.players(), n = players.length, started = false, autoT = null;
    var teams = null, hasTeam = false, left = null, minN = type==='tug'?2:1;
    var assign = function(){ teams = {}; hasTeam = players.every(function(p){ return p.team==='A' || p.team==='B'; }) && players.some(function(p){ return p.team==='A'; }) && players.some(function(p){ return p.team==='B'; });
      var sh = hasTeam ? players : P.shuffle(players); sh.forEach(function(p, i){ teams[p.id] = hasTeam ? p.team : (i%2===0?'A':'B'); }); };
    if(type==='tug'){ assign(); ctx.set({ phase:'ready', teams:teams }); }
    var tm = function(p){ return teams ? teams[p.id] : p.team; };
    var roster = function(tn, col){ var list = players.filter(function(p){ return teams[p.id]===tn; }), sz = n>20?30:n>10?38:48;
      return '<div class="box" style="flex:1;min-width:0;padding:12px 14px;border-color:'+col+'"><div style="font-weight:900;font-size:20px;color:'+col+';margin-bottom:8px">'+tn+'팀 '+list.length+'명</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">'
        +list.map(function(p){ return '<div style="width:'+(sz+22)+'px;text-align:center"><div style="width:'+sz+'px;margin:0 auto">'+Jelly.svg(p.avatar, tn)+'</div><div style="font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.nickname)+'</div></div>'; }).join('')+'</div></div>'; };
    var intro = function(){ ctx.stage.innerHTML = '<div class="pt" style="align-items:center;text-align:center"><h2>'+M.icon+' '+M.ko+'</h2>'+(type==='tug'?'':'<div style="font-size:84px;line-height:1">'+M.icon+'</div>')
      +'<div class="box" style="text-align:left;font-size:'+(type==='tug'?17:20)+'px;line-height:1.8;max-width:640px">'+M.how.map(function(h, i){ return '<b>'+(i+1)+'.</b> '+esc(h); }).join('<br>')+'</div>'
      +(type==='tug' ? '<div style="display:flex;gap:14px;width:100%;max-width:900px;align-items:stretch">'+roster('A', '#0AA593')+'<div class="display" style="align-self:center;font-size:30px">VS</div>'+roster('B', '#FF5D8F')+'</div>'
          +'<div class="mut">'+(hasTeam ? '팀전에서 정한 팀 그대로 겨뤄요' : '개인전이라 이번 판만 두 팀으로 나눴어요 · 각자 휴대폰에 내 팀이 보여요')+'</div>' : '')
      +(n<minN ? '<div class="mut">참가자가 '+minN+'명 이상 있어야 해요</div>' : '<div class="row" style="justify-content:center">'+(type==='tug' && !hasTeam ? '<button id="acMix" class="ghost bigbtn">🔀 팀 다시 섞기</button>' : '')+'<button id="acGo" class="bigbtn">'+(left!=null?'시작! ('+left+')':'게임 시작!')+'</button></div>')+'</div>';
      var b = ctx.stage.querySelector('#acGo'); if(b) b.onclick = go;
      var mx = ctx.stage.querySelector('#acMix'); if(mx) mx.onclick = function(){ if(started) return; clearInterval(autoT); left = null; assign(); ctx.set({ phase:'ready', teams:teams }); intro(); }; };
    intro();
    if(window.autoOn && n>=minN){ left = type==='tug'?10:6; intro(); autoT = setInterval(function(){ if(ctx.stopped() || started){ clearInterval(autoT); return; } left--; if(left<=0){ clearInterval(autoT); go(); } else { var b = ctx.stage.querySelector('#acGo'); if(b) b.textContent = '시작! ('+left+')'; } }, 1000); }

    async function go(){ if(started) return; started = true; clearInterval(autoT);
      var seed = 1+P.rnd(2000000000), run = Date.now(), x = 0, base = { phase:'play', seed:seed, run:run }; if(teams) base.teams = teams;
      await ctx.set(type==='tug' ? Object.assign({ x:0 }, base) : base);
      var t0 = Date.now()+3600, inp = {}, prevN = {}, winner = null;
      ctx.stage.innerHTML = '<div class="pt" style="align-items:center"><div class="row" style="justify-content:space-between;width:100%"><h2>'+M.icon+' '+M.ko+'</h2><div class="display" id="acClock" style="font-size:44px;color:var(--coral)"></div></div><div id="acBig" style="width:100%"></div><div class="mut" id="acNote"></div></div>';
      var big = ctx.stage.querySelector('#acBig'), els = null;
      var paint = function(el){
        var rows = ranked(type, players, inp), fin = players.filter(function(p){ return inp[p.id] && inp[p.id].fin; }).length;
        var note = ctx.stage.querySelector('#acNote'), ck = ctx.stage.querySelector('#acClock'); if(!big || !note) return;
        ck.textContent = el<0 ? Math.ceil(-el) : (type==='run'||type==='rope'||type==='claw'||type==='pump') ? '' : Math.max(0, Math.ceil(M.dur-el));
        note.textContent = type==='tug' ? '' : '끝낸 사람 '+fin+' / '+n+'명';
        if(type==='run'){
          if(!els){ big.innerHTML = '<div style="display:flex;gap:16px;align-items:stretch"><div id="acTrack" style="position:relative;flex:1;height:'+Math.max(300, Math.min(520, n*30+40))+'px;background:#fff;border:3px solid var(--ink);border-radius:14px;overflow:hidden">'
              +[10,20,30,40].map(function(v){ return '<div style="position:absolute;left:'+(4+v/GOAL*88)+'%;top:0;bottom:0;border-left:2px dashed #E6DCC2"></div><div style="position:absolute;left:'+(4.5+v/GOAL*88)+'%;bottom:2px;font-size:12px;font-weight:800;color:#B0A78C">'+v+'m</div>'; }).join('')
              +'<div style="position:absolute;left:92%;top:0;bottom:0;width:14px;background:repeating-linear-gradient(0deg,#1B1530 0 10px,#fff 10px 20px)"></div><div style="position:absolute;right:6px;top:4px;font-size:24px">🏁</div></div><div id="acSide" style="width:270px;display:flex;flex-direction:column;gap:6px"></div></div>';
            els = {}; var tr = big.querySelector('#acTrack'), sz = n>20?26:n>10?34:46, hh = tr.clientHeight-sz*1.2-22;
            players.forEach(function(p, i){ var d = document.createElement('div'); d.style.cssText = 'position:absolute;left:1%;top:'+(4+(n>1?i*hh/(n-1):hh/2))+'px;width:'+sz+'px;transition:left .7s linear'; d.innerHTML = Jelly.svg(p.avatar, p.team)+'<span style="position:absolute;left:100%;top:20%;font-size:12px;font-weight:900;background:#FFE066;border:2px solid var(--ink);border-radius:999px;padding:0 6px;white-space:nowrap;display:none"></span>'; tr.appendChild(d); els[p.id] = d; }); }
          var top3 = rows.slice(0, 3).map(function(r){ return r.p.id; });
          players.forEach(function(p){ var v = inp[p.id], d = v ? (v.f!=null?GOAL:(v.d||0)) : 0, e = els[p.id]; e.style.left = (1+d/GOAL*88)+'%'; var s = e.lastChild, show = n<=10 || top3.indexOf(p.id)>=0; s.style.display = show?'block':'none'; if(show) s.textContent = p.nickname; });
          big.querySelector('#acSide').innerHTML = '<div style="font-weight:900">🏆 실시간 순위</div>'+rows.slice(0, 7).map(function(r, i){ return '<div style="display:flex;justify-content:space-between;background:#fff;border:3px solid var(--ink);border-radius:12px;padding:4px 10px;font-weight:800"><span>'+(i+1)+'. '+esc(r.p.nickname)+'</span><span style="color:'+(r.v&&r.v.f!=null?'var(--coral)':'var(--muted)')+'">'+label(type, r.v)+'</span></div>'; }).join('');
        } else if(type==='rope'){
          var alive = players.filter(function(p){ return !(inp[p.id] && (inp[p.id].o || inp[p.id].fin)); }), mxn = rows.length && rows[0].m ? rows[0].m : 0, sz2 = n>20?48:n>10?64:84;
          big.innerHTML = '<div style="display:flex;gap:16px"><div style="flex:1;background:linear-gradient(#DDF3FF 86%,#B9E4A6 86%);border:3px solid var(--ink);border-radius:14px;padding:14px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;min-height:300px">'
            +players.map(function(p){ var out = alive.indexOf(p)<0; return '<div style="width:'+sz2+'px;text-align:center;'+(out?'opacity:.3;filter:grayscale(1)':'')+'"><div class="'+(out?'':'m-jump')+'" style="'+(out?'transform:rotate(70deg)':'')+'">'+Jelly.svg(p.avatar, p.team)+'</div>'+(n<=12?'<div style="font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.nickname)+'</div>':'')+'</div>'; }).join('')
            +'</div><div style="width:250px;text-align:center"><div class="mut">가장 많이 넘은 횟수</div><div class="display" style="font-size:80px;color:var(--coral);line-height:1.1">'+mxn+'번</div><div style="font-weight:900;font-size:22px">남은 사람 '+alive.length+'명</div><div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">'+rows.slice(0, 5).map(function(r, i){ return '<div style="display:flex;justify-content:space-between;background:#fff;border:3px solid var(--ink);border-radius:12px;padding:3px 10px;font-weight:800"><span>'+(i+1)+'. '+esc(r.p.nickname)+'</span><span>'+label(type, r.v)+'</span></div>'; }).join('')+'</div></div></div>';
        } else if(type==='tug'){
          var A = players.filter(function(p){ return teams[p.id]==='A'; }), B = players.filter(function(p){ return teams[p.id]==='B'; }), ox = x*2.6, sz3 = n>20?34:n>10?44:60;
          var mem = function(list, dir){ return list.map(function(p, k){ return '<div style="position:absolute;left:calc(50% + '+(ox+dir*(40+k*sz3*0.6)-sz3/2)+'px);top:'+(86+(k%2)*12)+'px;width:'+sz3+'px;transform:rotate('+(-dir*12)+'deg);transition:left .7s linear;z-index:'+(k%2)+'">'+Jelly.svg(p.avatar, dir<0?'A':'B')+'</div>'; }).join(''); };
          var topOf = function(list){ var b = null; list.forEach(function(p){ var v = inp[p.id] ? (inp[p.id].n||0) : 0; if(!b || v>b.v) b = { p:p, v:v }; }); return b ? esc(b.p.nickname)+' '+b.v+'번' : '-'; };
          big.innerHTML = '<div style="display:flex;justify-content:space-between;font-weight:900;font-size:22px"><span style="color:#0AA593">◀ A팀 '+A.length+'명</span><span style="color:#FF5D8F">B팀 '+B.length+'명 ▶</span></div>'
            +'<div style="position:relative;height:250px;background:linear-gradient(#DDF3FF 64%,#B9E4A6 64%);border:3px solid var(--ink);border-radius:14px;overflow:hidden;margin-top:6px"><div style="position:absolute;left:50%;top:0;bottom:0;border-left:4px dashed var(--ink);opacity:.5"></div>'
            +'<div style="position:absolute;left:calc(50% + '+(ox-600)+'px);top:128px;width:1200px;height:9px;background:#8B5A2B;border-radius:5px;transition:left .7s linear"></div><div style="position:absolute;left:calc(50% + '+(ox-16)+'px);top:88px;font-size:34px;transition:left .7s linear">🚩</div>'+mem(A, -1)+mem(B, 1)+'</div>'
            +'<div style="position:relative;height:30px;background:#fff;border:3px solid var(--ink);border-radius:15px;overflow:hidden;margin-top:10px"><div style="position:absolute;left:0;top:0;bottom:0;width:'+(50-x/2)+'%;background:#2DD4BF;transition:width .7s linear"></div><div style="position:absolute;right:0;top:0;bottom:0;width:'+(50+x/2)+'%;background:#FF5D8F;transition:width .7s linear"></div><div style="position:absolute;left:50%;top:0;bottom:0;border-left:3px solid var(--ink)"></div></div>'
            +'<div style="display:flex;justify-content:space-between;font-weight:800;margin-top:8px"><span>🔥 A팀 연타왕: '+topOf(A)+'</span><span>B팀 연타왕: '+topOf(B)+' 🔥</span></div>';
        } else if(type==='pump'){
          var sz4 = n>20?92:n>10?112:140;
          big.innerHTML = '<div style="display:flex;gap:16px"><div style="flex:1;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start">'+players.map(function(p){ var v = inp[p.id]||{}, bs = Math.min(sz4*0.42, 12+(v.p||0)*3);
              return '<div style="width:'+sz4+'px;height:76px;background:#fff;border:3px solid var(--ink);border-radius:12px;position:relative;overflow:hidden"><div style="position:absolute;left:4px;bottom:2px;width:30px">'+Jelly.svg(p.avatar, p.team)+'</div><div style="position:absolute;left:36px;right:2px;top:0;bottom:18px;display:flex;align-items:center;justify-content:center">'
                +(v.fin?'<span style="font-weight:900;color:#0AA593">완료</span>':v.b?'<span style="font-size:28px">💥</span>':'<span style="display:block;width:'+bs+'px;height:'+(bs*1.14)+'px;border-radius:50%;border:2px solid var(--ink);background:'+((v.p||0)>=9?'#FF5D5D':'#FF8FD0')+';transition:all .5s"></span>')
                +'</div><div style="position:absolute;right:5px;bottom:1px;font-size:12px;font-weight:900">'+(v.s||0)+'점</div>'+(n<=12?'<div style="position:absolute;left:36px;bottom:1px;font-size:11px;font-weight:800;max-width:'+(sz4-80)+'px;overflow:hidden;white-space:nowrap">'+esc(p.nickname)+'</div>':'')+'</div>'; }).join('')
            +'</div><div style="width:260px;display:flex;flex-direction:column;gap:6px"><div style="font-weight:900">🏆 실시간 순위</div>'+rows.slice(0, 7).map(function(r, i){ return '<div style="display:flex;justify-content:space-between;background:#fff;border:3px solid var(--ink);border-radius:12px;padding:4px 10px;font-weight:800"><span>'+(i+1)+'. '+esc(r.p.nickname)+'</span><span>'+label(type, r.v)+'</span></div>'; }).join('')+'</div></div>';
        } else {
          big.innerHTML = '<div style="display:flex;flex-direction:column;gap:7px;max-width:820px;margin:0 auto">'+boardHTML(type, rows, n>16?10:8)+'</div>';
        }
      };
      var hardEnd = M.dur + 4;
      while(!ctx.stopped()){
        var el = (Date.now()-t0)/1000;
        try{ inp = await ctx.inputs(); }catch(e){}
        if(ctx.stopped()) return;
        if(type==='tug' && el>0 && winner===null){
          var sum = { A:0, B:0 }, cnt = { A:0, B:0 }; players.forEach(function(p){ var v = inp[p.id] ? (inp[p.id].n||0) : 0, d = Math.max(0, v-(prevN[p.id]||0)); prevN[p.id] = v; sum[teams[p.id]] += d; cnt[teams[p.id]]++; });
          var ra = cnt.A ? sum.A/cnt.A : 0, rb = cnt.B ? sum.B/cnt.B : 0; x = Math.max(-100, Math.min(100, x - (ra-rb)*3.2));
          if(x<=-100) winner = 'A'; else if(x>=100) winner = 'B'; else if(el >= M.dur) winner = x<-1?'A':x>1?'B':'D';
          if(winner===null) ctx.set(Object.assign({ x:Math.round(x) }, base));
        }
        paint(el);
        var allFin = n>0 && players.every(function(p){ return inp[p.id] && inp[p.id].fin; });
        if(type==='tug' ? winner!==null : (el > 4 && allFin) || el > hardEnd) break;
        await P.sleep(700);
      }
      if(ctx.stopped()) return;
      await P.sleep(type==='tug'?400:900); try{ inp = await ctx.inputs(); }catch(e){} paint(M.dur);
      ctx.set({ phase:'end' });
      var rows = ranked(type, players, inp), gain = {}, played = rows.filter(function(r){ return r.m!=null; });
      if(type==='tug'){ players.forEach(function(p){ gain[p.id] = winner==='D' ? 60 : (teams[p.id]===winner ? 100 : 30); }); }
      else played.forEach(function(r, i){ gain[r.p.id] = played.length>1 ? Math.round(100 - 70*i/(played.length-1)) : 100; });
      var first = played[0];
      var answer = type==='tug' ? (winner==='D' ? '무승부!' : winner+'팀 승리!') : first ? esc(first.p.nickname)+' · '+label(type, first.v) : '기록이 없어요';
      var dist = type==='tug' ? ['A','B'].map(function(tn){ return '<div class="rank"><span class="nm">'+tn+'팀 '+(winner===tn?'🏆':'')+'</span><b>'+players.filter(function(p){ return teams[p.id]===tn; }).reduce(function(s, p){ return s + (inp[p.id] ? (inp[p.id].n||0) : 0); }, 0)+'번</b></div>'; }).join('')
        : rows.slice(0, 10).map(function(r, i){ return '<div class="rank"><span class="no">'+(i+1)+'</span><span class="nm">'+esc(r.p.nickname)+'</span><b>'+label(type, r.v)+'</b></div>'; }).join('');
      var pop = document.createElement('div'); pop.className = 'pt'; pop.style.cssText = 'position:fixed;inset:0;background:rgba(27,21,48,.55);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px';
      pop.innerHTML = '<div class="box pop" style="text-align:center;padding:24px 36px;background:#fff;max-width:92vw"><div style="font-size:60px;line-height:1">'+(type==='tug'?'🏆':M.icon)+'</div><div class="mut">'+(type==='tug'?'줄다리기 결과':'1등')+'</div>'
        +(type!=='tug' && first ? '<div style="width:120px;margin:4px auto">'+Jelly.svg(first.p.avatar, first.p.team, 'wink')+'</div>' : '')+'<div class="display" style="font-size:40px;color:var(--coral)">'+answer+'</div><div style="margin-top:14px"><button id="acDone" class="bigbtn">결과 보기 →</button></div></div>';
      document.body.appendChild(pop);
      var done = function(){ if(pop.parentNode) pop.parentNode.removeChild(pop); if(ctx.stopped()) return; ctx.finish(gain, { label:M.ko+' 결과', answer:answer, stat:n+'명 참여', distTitle:type==='tug'?'팀별 당긴 횟수':'순위', distHtml:dist }); };
      pop.querySelector('#acDone').onclick = done; if(window.autoOn) setTimeout(function(){ if(pop.parentNode) done(); }, 5000);
    }
  }; }

  P.ACTION.forEach(function(k){ P.games[k] = host(k); P.phone[k] = phone(k); });
})();
