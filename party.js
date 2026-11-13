/* 탭퀴즈 분위기형 게임 모음 (host.html / player.html 공용)
 * 호스트가 상태(state)를 rooms.reaction_sequence 에 적어 두면 휴대폰이 읽어서 화면을 그리고,
 * 휴대폰은 answers.answer_value(JSON) 에 자기 입력을 적어요. (스키마 변경 없음)
 */
(function(){
  'use strict';
  var INK = '#1B1530';
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function rnd(n){ var a = new Uint32Array(1); (window.crypto||window.msCrypto).getRandomValues(a); return a[0] % n; }   // 0..n-1 (공정한 난수)
  function rndf(){ var a = new Uint32Array(1); (window.crypto||window.msCrypto).getRandomValues(a); return a[0]/4294967296; }
  function shuffle(arr){ var a = arr.slice(); for(var i=a.length-1;i>0;i--){ var j = rnd(i+1), t = a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function av(p, w){ return '<span class="av" style="width:'+w+'px">'+Jelly.svg(p.avatar, p.team)+'</span>'; }
  function ls(k, d){ try{ var v = JSON.parse(localStorage.getItem(k)); return v==null ? d : v; }catch(e){ return d; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  var CSS = '.pt{display:flex;flex-direction:column;gap:14px;width:100%}'
   +'.pt h2{margin:0;font-family:var(--display);font-weight:400;font-size:30px;line-height:1.25}'
   +'.pt .box{background:var(--card);border:3px solid var(--ink);border-radius:18px;padding:16px 18px;box-shadow:4px 4px 0 var(--ink)}'
   +'.pt textarea,.pt input[type=text],.pt input[type=number],.pt select{font-size:16px}'
   +'.pt .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}'
   +'.pt .bigbtn{height:64px;font-size:22px;padding:0 34px}'
   +'.pt .chip{display:inline-flex;align-items:center;gap:8px;background:#fff;border:3px solid var(--ink);border-radius:999px;padding:4px 14px 4px 6px;font-weight:800;font-size:16px}'
   +'.pt .tile{background:#fff;border:3px solid var(--ink);border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:800;min-width:0}'
   +'.pt .mut{color:var(--muted);font-size:14px;font-weight:600}'
   +'.pt .pbtn{height:auto;min-height:58px;font-size:20px;border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink)}'
   +'@keyframes pt-shake{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}'
   +'@keyframes pt-pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}'
   +'.pt .pop{animation:pt-pop .55s ease-out both}'
   +'.pt .shake{display:inline-block;animation:pt-shake .35s ease-in-out infinite}';
  (function(){ var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); })();

  var META = {
    raffle:{ ko:'행운권 추첨', icon:'🎟️' }, wheel:{ ko:'돌림판', icon:'🎡' }, ladder:{ ko:'사다리 타기', icon:'🪜' },
    order:{ ko:'순서 정하기', icon:'🔢' }, liar:{ ko:'라이어 게임', icon:'🤥' }, draw:{ ko:'도형 그리기', icon:'✏️' },
    rps:{ ko:'가위바위보 서바이벌', icon:'✌️' }, bomb:{ ko:'폭탄 돌리기', icon:'💣' }
  };
  var HAND = { rock:'✊', paper:'🖐️', scissors:'✌️' }, HAND_KO = { rock:'바위', paper:'보', scissors:'가위' };
  var WORDS = {
    food:['김치찌개','떡볶이','치킨','피자','삼겹살','라면','비빔밥','초밥','햄버거','짜장면','냉면','김밥','순대','파스타','떡국'],
    animal:['호랑이','코끼리','기린','펭귄','고양이','강아지','토끼','돌고래','악어','독수리','다람쥐','곰','원숭이','거북이','하마'],
    place:['도서관','놀이공원','공항','병원','영화관','수영장','지하철','목욕탕','편의점','학교','캠핑장','동물원','헬스장','노래방','시장'],
    job:['소방관','요리사','의사','선생님','경찰관','가수','우주비행사','농부','변호사','미용사','운전기사','만화가','간호사','사진작가','파일럿'],
    movie:['겨울왕국','어벤져스','해리포터','토이스토리','타이타닉','기생충','라이온킹','인어공주','쿵푸팬더','슈렉','아바타','신비아파트','뽀로로','엘사','헐크']
  };
  var CAT_KO = { food:'음식', animal:'동물', place:'장소', job:'직업', movie:'영화·캐릭터' };

  /* ───────────────── 도형 그리기: 채점 (호스트가 계산) ───────────────── */
  function resample(pts, n){
    var d = 0, i, seg = [0];
    for(i=1;i<pts.length;i++){ d += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(d); }
    if(d<=0) return null;
    var out = [], step = d/(n-1), j = 1;
    for(i=0;i<n;i++){
      var t = i*step; while(j<pts.length-1 && seg[j]<t) j++;
      var a = pts[j-1], b = pts[j], l = seg[j]-seg[j-1] || 1, f = Math.max(0, Math.min(1, (t-seg[j-1])/l));
      out.push([a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]);
    }
    return out;
  }
  function centroid(p){ var x=0,y=0; p.forEach(function(q){ x+=q[0]; y+=q[1]; }); return [x/p.length, y/p.length]; }
  function turnAngle(p){ var c = centroid(p), tot = 0, prev = null;
    p.forEach(function(q){ var a = Math.atan2(q[1]-c[1], q[0]-c[0]); if(prev!==null){ var d = a-prev; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; tot += d; } prev = a; });
    return Math.abs(tot); }
  function templatePts(shape){
    var pts = [], i;
    if(shape==='triangle'){ var v = [[0,-1],[0.95,0.75],[-0.95,0.75],[0,-1]];
      for(i=0;i<3;i++){ for(var k=0;k<32;k++){ var f = k/32; pts.push([v[i][0]+(v[i+1][0]-v[i][0])*f, v[i][1]+(v[i+1][1]-v[i][1])*f]); } } pts.push([0,-1]); }
    else if(shape==='heart'){ for(i=0;i<=96;i++){ var t = i/96*2*Math.PI; pts.push([16*Math.pow(Math.sin(t),3), -(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))]); } }
    else { for(i=0;i<=96;i++){ var u = i/96*2*Math.PI; pts.push([Math.sin(u), -Math.cos(u)]); } }
    return pts;
  }
  function normShape(p){ var c = centroid(p), r = 0; p.forEach(function(q){ r += (q[0]-c[0])*(q[0]-c[0])+(q[1]-c[1])*(q[1]-c[1]); }); r = Math.sqrt(r/p.length) || 1;
    return { pts:p.map(function(q){ return [(q[0]-c[0])/r, (q[1]-c[1])/r]; }), c:c, r:r }; }
  /* 점수 0~100과 맞춰 그릴 도형(그림 좌표계) 을 돌려줘요 */
  function scoreDrawing(shape, raw){
    var res = { score:0, fit:null, note:'' };
    if(!raw || raw.length<8){ res.note = '그림이 너무 짧아요'; return res; }
    var p = resample(raw, 96); if(!p){ res.note = '그림이 너무 짧아요'; return res; }
    var c = centroid(p), meanR = 0; p.forEach(function(q){ meanR += Math.hypot(q[0]-c[0], q[1]-c[1]); }); meanR /= p.length;
    if(meanR < 60){ res.note = '너무 작아요'; return res; }
    var turn = turnAngle(p);
    var gap = Infinity; for(var gi=0; gi<10; gi++) gap = Math.min(gap, Math.hypot(p[gi][0]-p[95][0], p[gi][1]-p[95][1])); gap /= meanR;
    if(shape==='circle'){
      if(turn < Math.PI*1.7){ res.note = '한 바퀴를 못 돌았어요'; return res; }
      // 최소제곱 원 맞춤 (Kåsa)
      var n = p.length, sx=0, sy=0, sxx=0, syy=0, sxy=0, sz=0, sxz=0, syz=0;
      p.forEach(function(q){ var x=q[0], y=q[1], z=x*x+y*y; sx+=x; sy+=y; sxx+=x*x; syy+=y*y; sxy+=x*y; sz+=z; sxz+=x*z; syz+=y*z; });
      var A = n*sxx-sx*sx, B = n*sxy-sx*sy, C = n*syy-sy*sy, Dd = 0.5*(n*sxz-sx*sz), E = 0.5*(n*syz-sy*sz), den = A*C-B*B, cx = c[0], cy = c[1], rr = meanR;
      if(Math.abs(den)>1e-6){ cx = (Dd*C-B*E)/den; cy = (A*E-B*Dd)/den; rr = 0; p.forEach(function(q){ rr += Math.hypot(q[0]-cx, q[1]-cy); }); rr /= n; }
      var vr = 0; p.forEach(function(q){ var d = Math.hypot(q[0]-cx, q[1]-cy)-rr; vr += d*d; });
      var e = Math.sqrt(vr/n)/rr;
      res.score = Math.round(Math.max(0, 100*Math.max(0, 1-e/0.2) - Math.min(18, gap*30)));
      res.fit = { type:'circle', cx:cx, cy:cy, r:rr };
      return res;
    }
    if(turn < Math.PI*1.5){ res.note = '한 바퀴를 못 돌았어요'; return res; }
    var D = normShape(p), T = normShape(resample(templatePts(shape), 96)), N = 96, best = Infinity, bestOff = 0, bestDir = 1;
    for(var dir=-1; dir<=1; dir+=2){ for(var off=0; off<N; off+=2){ var sum = 0;
      for(var i=0;i<N;i+=2){ var j = ((off + dir*i)%N + N)%N; sum += Math.hypot(D.pts[i][0]-T.pts[j][0], D.pts[i][1]-T.pts[j][1]); }
      sum /= (N/2); if(sum<best){ best = sum; bestOff = off; bestDir = dir; } } }
    res.score = Math.round(Math.max(0, 100*Math.max(0, 1-best/0.6) - Math.min(10, gap*15)));
    res.fit = { type:'poly', pts:T.pts.map(function(q){ return [q[0]*D.r+D.c[0], q[1]*D.r+D.c[1]]; }) };
    return res;
  }
  function pathOf(shape, size){   // 안내용 도형 SVG path (0~size)
    var pts = templatePts(shape), mx = 0; pts.forEach(function(q){ mx = Math.max(mx, Math.abs(q[0]), Math.abs(q[1])); });
    return 'M'+pts.map(function(q){ return ((q[0]/mx*0.42+0.5)*size).toFixed(1)+','+((q[1]/mx*0.42+0.5)*size).toFixed(1); }).join(' L')+' Z';
  }

  window.TQParty = { META:META, WORDS:WORDS, CAT_KO:CAT_KO, HAND:HAND, HAND_KO:HAND_KO, esc:esc, rnd:rnd, rndf:rndf, shuffle:shuffle, sleep:sleep, av:av, ls:ls, lsSet:lsSet,
    scoreDrawing:scoreDrawing, pathOf:pathOf, templatePts:templatePts, games:{}, phone:{} };
})();
