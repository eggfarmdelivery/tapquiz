/* 탭퀴즈 결과 이미지 만들기 (서버 없이 브라우저에서 PNG 생성)
 * TQShare.make(list, {meId, title}) -> Promise<Blob>   list = [{nickname,score,avatar,team}] 점수순
 * TQShare.send(blob) -> 공유 시트(지원 기기) 또는 PNG 다운로드
 */
(function(){
  'use strict';
  function avImg(p){
    return new Promise(function(res){
      var im = new Image();
      im.onload = function(){ res(im); }; im.onerror = function(){ res(null); };
      try{ im.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(Jelly.svg(p.avatar, p.team).replace('<svg ', '<svg width="104" height="126" ')); }
      catch(e){ res(null); }
    });
  }
  function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  async function make(list, opt){
    opt = opt || {};
    var top = list.slice(0, 8), W = 1080, rowH = 118, H = 330 + top.length*rowH + 150;
    var imgs = await Promise.all(top.map(avImg));
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
    c.fillStyle = '#FFF0C9'; c.fillRect(0,0,W,H);
    c.fillStyle = '#1B1530'; rr(c, 60, 56, 250, 84, 22); c.fill();
    c.fillStyle = '#FFC24B'; c.font = '900 56px "Black Han Sans","Noto Sans KR",sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText('탭퀴즈', 90, 100);
    c.fillStyle = '#1B1530'; c.font = '800 64px "Noto Sans KR",sans-serif'; c.fillText(opt.title || '최종 결과', 60, 215);
    c.fillStyle = '#6B6585'; c.font = '600 30px "Noto Sans KR",sans-serif'; c.fillText(list.length + '명 참여', 60, 280);
    var medal = ['#FFC24B','#CFD3DC','#E7A06B'];
    top.forEach(function(p, i){
      var y = 330 + i*rowH, me = opt.meId && p.id === opt.meId;
      c.fillStyle = i<3 ? ['#FFEFC2','#E8EAF0','#FFE3D2'][i] : '#FFFFFF';
      rr(c, 60, y, W-120, rowH-14, 28); c.fill(); c.lineWidth = me ? 8 : 4; c.strokeStyle = me ? '#FF5D8F' : '#1B1530'; c.stroke();
      c.fillStyle = i<3 ? medal[i] : '#E5E0F2'; c.beginPath(); c.arc(130, y+(rowH-14)/2, 36, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = '#1B1530'; c.stroke();
      c.fillStyle = '#1B1530'; c.font = '900 40px "Noto Sans KR",sans-serif'; c.textAlign = 'center'; c.fillText(String(i+1), 130, y+(rowH-14)/2+2);
      if(imgs[i]) c.drawImage(imgs[i], 190, y+2, 84, 100);
      c.textAlign = 'left'; c.font = '800 42px "Noto Sans KR",sans-serif';
      var nm = String(p.nickname || ''); while(c.measureText(nm).width > 440 && nm.length > 1) nm = nm.slice(0,-1);
      c.fillText(nm, 300, y+(rowH-14)/2+2);
      c.textAlign = 'right'; c.font = '900 44px "Noto Sans KR",sans-serif'; c.fillStyle = '#FF5D8F'; c.fillText(p.score + '점', W-100, y+(rowH-14)/2+2);
    });
    c.textAlign = 'center'; c.fillStyle = '#6B6585'; c.font = '700 30px "Noto Sans KR",sans-serif';
    c.fillText('QR만 찍으면 바로 시작하는 실시간 퀴즈쇼 · 탭퀴즈', W/2, H-70);
    return new Promise(function(res){ cv.toBlob(function(b){ res(b); }, 'image/png'); });
  }
  async function send(blob, name){
    name = name || 'tapquiz-result.png';
    try{
      var f = new File([blob], name, { type:'image/png' });
      if(navigator.canShare && navigator.canShare({ files:[f] })){ await navigator.share({ files:[f], title:'탭퀴즈 결과' }); return 'shared'; }
    }catch(e){ if(e && e.name === 'AbortError') return 'cancel'; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000); return 'saved';
  }
  window.TQShare = { make:make, send:send };
})();
