/* 탭퀴즈 젤리 캐릭터 (오프라인 SVG, 외부 서버 불필요)
 * 사용법: <script src="jelly.js"></script> 를 host/player/demo 에서 불러오면 window.Jelly 사용 가능
 *
 *  - 아바타는 "색번호,소품번호" 문자열로 저장합니다. 예: "3,1"  (participants.avatar 컬럼)
 *  - 팀전에서 team('A'|'B')이 있으면 몸 색은 팀 색으로 바뀌고, 소품만 개인별로 유지됩니다.
 */
(function(){
  'use strict';

  var COLORS = ['#FF7A7A','#FFB84D','#F6E05E','#6EE7A0','#4DD0E1','#7AA2FF','#B388FF','#FF8FD0'];
  var COLOR_NAMES = ['딸기','귤','레몬','민트','하늘','블루베리','포도','복숭아'];
  var ACC_NAMES = ['새싹','토끼귀','고양이귀','곰귀','꽃','리본'];
  var TEAM = { A:'#2DD4BF', B:'#FF5D8F' };
  var DK = 'fill:#1E1B3A';

  function hash(s){
    var h = 7;
    s = String(s);
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function accessory(i, col){
    switch (i){
      case 0: return '<line x1="0" y1="-38" x2="0" y2="-45" style="stroke:#6EE7A0;stroke-width:2.2;stroke-linecap:round"/><ellipse cx="-4.5" cy="-46" rx="4.5" ry="2.6" transform="rotate(-25 -4.5 -46)" style="fill:#6EE7A0"/><ellipse cx="4.5" cy="-46" rx="4.5" ry="2.6" transform="rotate(25 4.5 -46)" style="fill:#6EE7A0"/>';
      case 1: return '<g transform="rotate(-10 -7 -38)"><ellipse cx="-7" cy="-45" rx="3.6" ry="8" style="fill:'+col+'"/><ellipse cx="-7" cy="-45" rx="1.8" ry="5.5" style="fill:#FFB3C7"/></g><g transform="rotate(10 7 -38)"><ellipse cx="7" cy="-45" rx="3.6" ry="8" style="fill:'+col+'"/><ellipse cx="7" cy="-45" rx="1.8" ry="5.5" style="fill:#FFB3C7"/></g>';
      case 2: return '<polygon points="-14,-31 -12,-45 -3,-37" style="fill:'+col+'"/><polygon points="14,-31 12,-45 3,-37" style="fill:'+col+'"/><polygon points="-11.5,-35 -10.8,-42 -6.5,-37.5" style="fill:#FFB3C7"/><polygon points="11.5,-35 10.8,-42 6.5,-37.5" style="fill:#FFB3C7"/>';
      case 3: return '<circle cx="-11" cy="-35" r="5.2" style="fill:'+col+'"/><circle cx="11" cy="-35" r="5.2" style="fill:'+col+'"/><circle cx="-11" cy="-35" r="2.4" style="fill:#FFB3C7"/><circle cx="11" cy="-35" r="2.4" style="fill:#FFB3C7"/>';
      case 4:
        var p = '';
        for (var k = 0; k < 5; k++){
          var a = k * 72 * Math.PI / 180;
          p += '<circle cx="'+(Math.sin(a)*3.4).toFixed(2)+'" cy="'+(-40 - Math.cos(a)*3.4).toFixed(2)+'" r="2.6" style="fill:#FFF3F8"/>';
        }
        return p + '<circle cx="0" cy="-40" r="2.2" style="fill:#FFC24B"/>';
      default: return '<g transform="translate(9 -34) rotate(20)"><ellipse cx="-4.5" cy="0" rx="4.6" ry="3" transform="rotate(-20 -4.5 0)" style="fill:#FF5D8F"/><ellipse cx="4.5" cy="0" rx="4.6" ry="3" transform="rotate(20 4.5 0)" style="fill:#FF5D8F"/><circle cx="0" cy="0" r="2" style="fill:#FFC24B"/></g>';
    }
  }

  function face(mouthType){
    var m = mouthType === 0
      ? '<path d="M-3 -18 Q0 -14.5 3 -18" style="fill:none;stroke:#1E1B3A;stroke-width:1.5;stroke-linecap:round"/>'
      : '<ellipse cx="0" cy="-17" rx="2.2" ry="2.5" style="fill:#1E1B3A"/><ellipse cx="0" cy="-16.1" rx="1.2" ry="1" style="fill:#FF8FAE"/>';
    return '<circle cx="-6" cy="-22" r="2.7" style="'+DK+'"/><circle cx="6" cy="-22" r="2.7" style="'+DK+'"/>' +
      '<circle cx="-5.1" cy="-23" r="1" style="fill:#fff"/><circle cx="6.9" cy="-23" r="1" style="fill:#fff"/>' +
      '<ellipse cx="-11" cy="-16.5" rx="3.1" ry="2" style="fill:#FF8FAE;opacity:.75"/><ellipse cx="11" cy="-16.5" rx="3.1" ry="2" style="fill:#FF8FAE;opacity:.75"/>' + m;
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

  /** 아바타 SVG 마크업. team이 'A'/'B'면 팀 색으로 그림 */
  function svg(avatar, team){
    var v = parse(avatar) || parse(fromNick(avatar));
    var col = (team === 'A' || team === 'B') ? TEAM[team] : COLORS[v.c];
    return '<svg class="jelly" viewBox="-26 -57 52 63" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      accessory(v.a, col) +
      '<ellipse cx="-8" cy="-1.5" rx="6" ry="3.4" style="fill:'+col+'"/><ellipse cx="8" cy="-1.5" rx="6" ry="3.4" style="fill:'+col+'"/>' +
      '<ellipse cx="0" cy="-19" rx="17" ry="17" style="fill:'+col+'"/>' +
      '<ellipse cx="-8" cy="-27" rx="3.6" ry="6" transform="rotate(25 -8 -27)" style="fill:#fff;opacity:.28"/>' +
      '<circle cx="-18" cy="-14" r="4.6" style="fill:'+col+'"/><circle cx="18" cy="-14" r="4.6" style="fill:'+col+'"/>' +
      face((v.c + v.a) % 2) + '</svg>';
  }

  /** 닉네임 등 사용자 입력을 innerHTML에 넣기 전에 반드시 통과시키는 이스케이프 */
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  window.Jelly = {
    COLORS: COLORS, COLOR_NAMES: COLOR_NAMES, ACC_NAMES: ACC_NAMES, TEAM: TEAM,
    parse: parse, fromNick: fromNick, random: random, svg: svg, esc: esc
  };
})();
