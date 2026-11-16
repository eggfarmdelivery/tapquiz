/* 탭퀴즈 젤리 캐릭터 "탭탭이" (오프라인 SVG, 외부 서버 불필요)
 * 사용법: <script src="jelly.js"></script> 를 host/player/demo 에서 불러오면 window.Jelly 사용 가능
 *
 *  - 아바타는 "색번호,소품번호" 문자열로 저장합니다. 예: "3,1"  (participants.avatar 컬럼)
 *  - 팀전에서 team('A'|'B')이 있으면 몸 색은 팀 색으로 바뀌고, 소품만 개인별로 유지됩니다.
 *  - 표정: Jelly.svg(avatar, team, 'happy') 처럼 세 번째 값으로 고릅니다.
 *      basic(기본) · surprise(깜짝) · wink(윙크) · sleepy(졸림) · focus(집중) · happy(활짝)
 */
(function(){
  'use strict';

  var COLORS = ['#FF7A7A','#FFB84D','#F6E05E','#6EE7A0','#4DD0E1','#7AA2FF','#B388FF','#FF8FD0'];
  var COLOR_NAMES = ['딸기','귤','레몬','민트','하늘','블루베리','포도','복숭아'];
  var ACC_NAMES = ['새싹','토끼귀','고양이귀','왕관','헤드폰','고깔모자'];
  var TEAM = { A:'#2DD4BF', B:'#FF5D8F' };
  var EXPR = ['basic','surprise','wink','sleepy','focus','happy'];
  var INK = '#1B1530';

  function hash(s){
    var h = 7;
    s = String(s);
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  /** 색을 어둡게 (k=0.86 이면 14% 어둡게) */
  function dk(hex, k){
    var n = parseInt(hex.slice(1), 16);
    var f = function(v){ v = Math.max(0, Math.min(255, Math.round(v * k))).toString(16); return v.length < 2 ? '0' + v : v; };
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  }

  /* 몸 뒤에 그리는 소품 (귀) */
  function back(a, c){
    if (a === 1) return '<g transform="rotate(-9 -9 -36)"><ellipse cx="-9" cy="-50" rx="5.6" ry="13" style="fill:'+c+'"/><ellipse cx="-9" cy="-50" rx="2.8" ry="9" style="fill:#FFB3C7"/></g>' +
      '<g transform="rotate(9 9 -36)"><ellipse cx="9" cy="-50" rx="5.6" ry="13" style="fill:'+c+'"/><ellipse cx="9" cy="-50" rx="2.8" ry="9" style="fill:#FFB3C7"/></g>';
    if (a === 2) return '<path d="M-22 -24 L-19 -48 L-4 -37 Z" style="fill:'+c+';stroke:'+c+';stroke-width:3;stroke-linejoin:round"/><path d="M22 -24 L19 -48 L4 -37 Z" style="fill:'+c+';stroke:'+c+';stroke-width:3;stroke-linejoin:round"/>' +
      '<path d="M-18 -30 L-17 -42 L-9 -36 Z" style="fill:#FFB3C7"/><path d="M18 -30 L17 -42 L9 -36 Z" style="fill:#FFB3C7"/>';
    return '';
  }
  /* 몸 앞에 그리는 소품 */
  function front(a){
    switch (a){
      case 0: return '<path d="M0 -37 v-9" style="fill:none;stroke:#3FBF7F;stroke-width:3.4;stroke-linecap:round"/>' +
        '<ellipse cx="-7.5" cy="-49" rx="8.5" ry="4.8" transform="rotate(-26 -7.5 -49)" style="fill:#6EE7A0"/><ellipse cx="7.5" cy="-49" rx="8.5" ry="4.8" transform="rotate(26 7.5 -49)" style="fill:#6EE7A0"/>' +
        '<path d="M-12 -51 q5 0 9 3 M12 -51 q-5 0 -9 3" style="fill:none;stroke:#3FBF7F;stroke-width:1.4;stroke-linecap:round"/>';
      case 3: return '<path d="M-11 -35 L-13 -51 L-6 -44 L0 -55 L6 -44 L13 -51 L11 -35 Z" style="fill:#FFC24B;stroke:#E0A020;stroke-width:1.4;stroke-linejoin:round"/>' +
        '<circle cx="0" cy="-41" r="2.2" style="fill:#FF5D8F"/><circle cx="-7" cy="-40" r="1.6" style="fill:#4DD0E1"/><circle cx="7" cy="-40" r="1.6" style="fill:#4DD0E1"/>';
      case 4: return '<path d="M-25 -12 C-26 -50 26 -50 25 -12" style="fill:none;stroke:'+INK+';stroke-width:3.6;stroke-linecap:round"/>' +
        '<rect x="-31" y="-20" width="9" height="16" rx="4.5" style="fill:#FF5D8F;stroke:'+INK+';stroke-width:1.6"/><rect x="22" y="-20" width="9" height="16" rx="4.5" style="fill:#FF5D8F;stroke:'+INK+';stroke-width:1.6"/>';
      case 5: return '<path d="M-11 -35 L1 -65 L11 -35 Z" style="fill:#7AA2FF"/>' +
        '<path d="M-7.2 -44 L7.6 -44 M-3.8 -53 L4.6 -53" style="fill:none;stroke:#FFFFFF;stroke-width:3.2;stroke-linecap:round"/>' +
        '<circle cx="1" cy="-65" r="4.2" style="fill:#FF5D8F"/>' +
        '<path d="M-12 -35 q11 4 24 0" style="fill:none;stroke:#FF5D8F;stroke-width:3.2;stroke-linecap:round"/>';
      default: return '';
    }
  }

  function eye(x){
    return '<ellipse cx="'+x+'" cy="-13" rx="4.2" ry="5" style="fill:'+INK+'"/><circle cx="'+(x+1.4)+'" cy="-15" r="1.6" style="fill:#fff"/><circle cx="'+(x-1.2)+'" cy="-11.4" r=".9" style="fill:#fff"/>';
  }
  function arc(x, up){ return '<path d="M'+(x-4)+' -13 q4 '+(up?-5:5)+' 8 0" style="fill:none;stroke:'+INK+';stroke-width:2.4;stroke-linecap:round"/>'; }
  var LINE = 'fill:none;stroke:'+INK+';stroke-width:2.2;stroke-linecap:round';
  function face(e){
    switch (e){
      case 1: /* 깜짝 */ return '<circle cx="-11" cy="-13" r="5" style="fill:#fff;stroke:'+INK+';stroke-width:2"/><circle cx="-11" cy="-13" r="2.2" style="fill:'+INK+'"/><circle cx="11" cy="-13" r="5" style="fill:#fff;stroke:'+INK+';stroke-width:2"/><circle cx="11" cy="-13" r="2.2" style="fill:'+INK+'"/>' +
        '<ellipse cx="0" cy="-5" rx="2.6" ry="3.4" style="fill:'+INK+'"/>';
      case 2: /* 윙크 */ return eye(-11) + arc(11, true) + '<path d="M-4 -7 q4 5 8 0 Z" style="fill:#FF5D8F;stroke:'+INK+';stroke-width:2;stroke-linejoin:round"/>';
      case 3: /* 졸림 */ return arc(-11, false) + arc(11, false) + '<path d="M-2 -5 h4" style="'+LINE+'"/>';
      case 4: /* 집중 */ return '<path d="M-15 -18 l8 3 M15 -18 l-8 3" style="fill:none;stroke:'+INK+';stroke-width:2.4;stroke-linecap:round"/>' +
        '<ellipse cx="-11" cy="-12" rx="4" ry="4" style="fill:'+INK+'"/><circle cx="-9.8" cy="-13.6" r="1.4" style="fill:#fff"/><ellipse cx="11" cy="-12" rx="4" ry="4" style="fill:'+INK+'"/><circle cx="12.2" cy="-13.6" r="1.4" style="fill:#fff"/>' +
        '<path d="M-4 -5 q4 -3 8 0" style="'+LINE+'"/>';
      case 5: /* 활짝 */ return arc(-11, true) + arc(11, true) + '<path d="M-6 -8 q6 9 12 0 Z" style="fill:#fff;stroke:'+INK+';stroke-width:2;stroke-linejoin:round"/>';
      default: /* 기본 */ return eye(-11) + eye(11) + '<path d="M-3 -6 q3 3 6 0" style="'+LINE+'"/>';
    }
  }

  function parse(avatar){
    var parts = String(avatar || '').split(',');
    var c = parseInt(parts[0], 10), a = parseInt(parts[1], 10);
    if (isNaN(c) || c < 0 || c >= COLORS.length || isNaN(a) || a < 0 || a >= ACC_NAMES.length) return null;
    return { c: c, a: a };
  }

  /** 닉네임으로 항상 같은 캐릭터를 만들어 "색,소품" 문자열로 돌려줌 */
  function fromNick(nick){
    var h = hash((nick || '').trim() || '익명');
    return (h % COLORS.length) + ',' + (Math.floor(h / 8) % ACC_NAMES.length);
  }

  function random(){
    return Math.floor(Math.random() * COLORS.length) + ',' + Math.floor(Math.random() * ACC_NAMES.length);
  }

  /** 아바타 SVG 마크업. team이 'A'/'B'면 팀 색으로 그림. expr 는 표정 이름(생략하면 기본) */
  function svg(avatar, team, expr){
    var v = parse(avatar) || parse(fromNick(avatar));
    var col = (team === 'A' || team === 'B') ? TEAM[team] : COLORS[v.c];
    var e = Math.max(0, EXPR.indexOf(expr || 'basic'));
    var d1 = dk(col, 0.82), d2 = dk(col, 0.86);
    return '<svg class="jelly" viewBox="-34 -70 68 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="0" cy="9" rx="22" ry="3.5" style="fill:#1B1530;opacity:.12"/>' +
      back(v.a, col) +
      '<ellipse cx="-9" cy="7" rx="6" ry="3.6" style="fill:'+d1+'"/><ellipse cx="9" cy="7" rx="6" ry="3.6" style="fill:'+d1+'"/>' +
      '<path d="M0 -38 C17 -38 27 -24 27 -10 C27 2 19 7 0 7 C-19 7 -27 2 -27 -10 C-27 -24 -17 -38 0 -38Z" style="fill:'+col+'"/>' +
      '<path d="M0 7 C-19 7 -27 2 -27 -10 C-27 -6 -18 2 0 2 C18 2 27 -6 27 -10 C27 2 19 7 0 7Z" style="fill:'+d2+'"/>' +
      '<ellipse cx="-13" cy="-27" rx="6" ry="3.4" transform="rotate(-32 -13 -27)" style="fill:#fff;opacity:.55"/><circle cx="-19" cy="-19" r="1.8" style="fill:#fff;opacity:.55"/>' +
      '<ellipse cx="-19" cy="-6" rx="4" ry="2.4" style="fill:#FF8FAE;opacity:.8"/><ellipse cx="19" cy="-6" rx="4" ry="2.4" style="fill:#FF8FAE;opacity:.8"/>' +
      face(e) + front(v.a) + '</svg>';
  }

  /** 닉네임 등 사용자 입력을 innerHTML에 넣기 전에 반드시 통과시키는 이스케이프 */
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  window.Jelly = {
    COLORS: COLORS, COLOR_NAMES: COLOR_NAMES, ACC_NAMES: ACC_NAMES, TEAM: TEAM, EXPR: EXPR,
    parse: parse, fromNick: fromNick, random: random, svg: svg, esc: esc
  };
})();
