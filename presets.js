/* 추천 문제 세트 (방장이 고르기만 하면 바로 시작)
 * - mcq 정답: correct_answers = ["옵션id"]
 * - text 정답: 공백 없이 소문자로 적은 문자열 목록 (비교할 때도 공백 제거 + 소문자로 맞춤)
 * - vote: 정답 없음
 * 정답이 있는 문제는 오래 변하지 않는 상식/속담만 사용했습니다.
 */
(function(){
  function mc(content, labels, correct, t){
    return { category:'family', qtype:'mcq', content:content,
      options: labels.map(function(l,i){ return {id:String(i+1), label:l}; }),
      correct_answers:[String(correct)], time_limit:t||10 };
  }
  function mcc(cat, content, labels, correct){
    return { category:cat, qtype:'mcq', content:content,
      options: labels.map(function(l,i){ return {id:String(i+1), label:l}; }),
      correct_answers:[String(correct)], time_limit:10 };
  }
  function sj(q, labels, correct){ return { category:'idiom', qtype:'mcq', content:'사자성어 완성: '+q,
    options: labels.map(function(l,i){ return {id:String(i+1), label:l}; }), correct_answers:[String(correct)], time_limit:15 }; }
  function pv(content, labels, correct){ return { category:'proverb', qtype:'mcq', content:content,
    options: labels.map(function(l,i){ return {id:String(i+1), label:l}; }), correct_answers:[String(correct)], time_limit:15 }; }
  function ch(initial, hint, ans){ return { category:'initial', qtype:'text', content:'초성: '+initial+'  (힌트: '+hint+')', options:null, correct_answers:ans, time_limit:20 }; }
  function bal(a, b){ return { category:'balance', qtype:'vote', content:a+' vs '+b,
    options:[{id:'1',label:a},{id:'2',label:b}], correct_answers:null, time_limit:10 }; }
  function react(shape, color, ko){ return { category:'reaction', qtype:'reaction', content:ko+'이 나오면 탭!',
    options:{ targetShape:shape, targetColor:color, minDelay:1000, maxDelay:3000, minDecoys:3, maxDecoys:6, frameDuration:700 },
    correct_answers:null, time_limit:20 }; }

  function num(content, ans, unit){ return { category:'number', qtype:'number', content:content, options:{unit:unit||''}, correct_answers:[String(ans)], time_limit:20 }; }
  function mash(sec){ return { category:'mash', qtype:'mash', content:'휴대폰을 마구 눌러요!', options:{mode:'count', duration:sec*1000}, correct_answers:null, time_limit:sec+10 }; }
  function mashN(n){ return { category:'mash', qtype:'mash', content:'정확히 '+n+'번 눌러요!', options:{mode:'exact', target:n, duration:10000}, correct_answers:null, time_limit:20 }; }
  function mashT(){ return { category:'mash', qtype:'mash', content:'감으로 10초를 맞춰요!', options:{mode:'time', target:10000, hideAfter:3000, duration:16000}, correct_answers:null, time_limit:26 }; }
  function shuf(swaps, ms){ return { category:'shuffle', qtype:'shuffle', content:'간식을 먹은 탭탭이를 찾아라!', options:{swaps:swaps, stepMs:ms}, correct_answers:null, time_limit:30 }; }
  function dif(cols, mode){ return { category:'diff', qtype:'diff', content:'다른 탭탭이를 찾아라!', options:{cols:cols, mode:mode}, correct_answers:null, time_limit:25 }; }
  function mem(cols, len){ return { category:'memory', qtype:'memory', content:'불이 켜지는 순서를 기억하세요!', options:{cols:cols, len:len, step:800}, correct_answers:null, time_limit:30 }; }
  function tnum(kind, n, title){ return { category:'tapnum', qtype:'tapnum', content:title, options:{n:n, kind:kind}, correct_answers:null, time_limit:30 }; }
  function cpos(cols, rows, ms){ return { category:'cardpos', qtype:'cardpos', content:'탭탭이 카드의 위치를 기억하세요!', options:{cols:cols, rows:rows, showMs:ms}, correct_answers:null, time_limit:25 }; }
  function nun(){ return { category:'nunchi', qtype:'nunchi', content:'눈치껏 숫자를 고르세요! 겹치면 0점!', options:{}, correct_answers:null, time_limit:20 }; }
  function calc(q, a){ return { category:'calc', qtype:'text', content:q, options:null, correct_answers:[String(a)], time_limit:20 }; }
  function party(type, title, opt){ return { category:type, qtype:type, content:title, options:opt||{}, correct_answers:null, time_limit:60 }; }
  var INK = { '빨강':'#FF4D4D', '파랑':'#2F6BFF', '초록':'#1FA95B', '노랑':'#F2B600', '보라':'#8E4DFF', '주황':'#FF8A1F' };
  var BASE4 = ['빨강','파랑','초록','노랑'];
  function strp(word, ink, six){
    var names = six ? Object.keys(INK) : BASE4, opts = [ink];
    [word].concat(names).forEach(function(n){ if(opts.length<4 && opts.indexOf(n)<0) opts.push(n); });
    opts.sort(function(a,b){ return names.indexOf(a)-names.indexOf(b); });
    return { category:'stroop', qtype:'mcq', content:'글자의 색깔은? {{ink:'+INK[ink]+'}}'+word,
      options:opts.map(function(n,i){ return {id:String(i+1), label:n}; }), correct_answers:[String(opts.indexOf(ink)+1)], time_limit:10 }; }
  function mt(content, labels){ return { category:'match', qtype:'match', content:content, options:labels.map(function(l,i){ return {id:String(i+1), label:l}; }), correct_answers:null, time_limit:10 }; }

  window.TQ_GAMES = [
    { id:'quiz', name:'퀴즈', desc:'문제를 보고 답을 맞혀요. 빨리 맞힐수록 점수가 높아요.',
      sets:[
        { id:'proverb', name:'속담 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          pv('가는 말이 고와야 오는 말이 ( )',['착하다','곱다','아름답다','따뜻하다'],2),
          pv('소 잃고 ( ) 고친다',['마구간','대문','외양간','울타리'],3),
          pv('낮말은 새가 듣고 밤말은 ( )가 듣는다',['고양이','쥐','개','벌레'],2),
          pv('아니 땐 굴뚝에 ( ) 날까',['불','재','냄새','연기'],4),
          pv('티끌 모아 ( )',['부자','보물','태산','금'],3),
          pv('원숭이도 ( )에서 떨어진다',['지붕','나무','절벽','바위'],2),
          pv('호랑이도 제 말 하면 ( )',['온다','간다','웃는다','운다'],1),
          pv('고래 싸움에 ( ) 등 터진다',['문어','멸치','오징어','새우'],4),
          pv('백지장도 맞들면 ( )',['가볍다','낫다','쉽다','좋다'],2),
          pv('열 길 물속은 알아도 한 길 ( ) 속은 모른다',['마음','바다','얼굴','사람'],4)
        ]},
        { id:'initial', name:'초성 퀴즈', desc:'10문제 · 직접 쓰기', questions:[
          ch('ㅅㄱ','과일',['사과']),
          ch('ㅂㄴㄴ','과일',['바나나']),
          ch('ㅋㅍ','마시는 것',['커피']),
          ch('ㅊㅋㄹ','간식',['초콜릿','초콜렛']),
          ch('ㅎㄹㅇ','동물',['호랑이']),
          ch('ㄱㅇㅇ','동물',['고양이']),
          ch('ㅊㅋ','배달 음식',['치킨']),
          ch('ㅎㄷㅍ','전자기기',['휴대폰','핸드폰']),
          ch('ㅋㅍㅌ','전자기기',['컴퓨터']),
          ch('ㅎㄱ','서울에 흐르는 강',['한강'])
        ]},
        { id:'family', name:'가족 모임 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mc('한글을 만든 왕은?',['태조','세종대왕','정조','광개토대왕'],2),
          mc('남한에서 가장 높은 산은?',['한라산','지리산','설악산','북한산'],1),
          mc('태극기 가운데 있는 둥근 무늬는?',['태극','팔괘','무궁화','건곤감리'],1),
          mc('거북선을 만든 장군은?',['을지문덕','이순신','강감찬','김유신'],2),
          mc('김치의 주재료는?',['무','배추','오이','고추'],2),
          mc('지구에서 가장 큰 바다는?',['대서양','인도양','태평양','북극해'],3),
          mc('달은 지구 주위를 도는 무엇일까요?',['위성','행성','별','혜성'],1),
          mc('올림픽 오륜기의 동그라미는 몇 개?',['3개','4개','5개','6개'],3),
          mc('세계에서 가장 큰 동물은?',['코끼리','기린','대왕고래','하마'],3),
          mc('우리나라 국화(나라꽃)는?',['장미','무궁화','벚꽃','진달래'],2)
        ]},
        { id:'common', name:'일반 상식 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mcc('common','1년은 며칠일까요? (윤년이 아닌 해)',['364일','365일','366일','360일'],2),
          mcc('common','무지개는 보통 몇 가지 색으로 말할까요?',['5가지','6가지','7가지','8가지'],3),
          mcc('common','축구는 한 팀에서 경기장에 몇 명이 뛸까요?',['9명','10명','11명','12명'],3),
          mcc('common','태양계에서 가장 큰 행성은?',['화성','목성','토성','지구'],2),
          mcc('common','올림픽은 몇 년마다 열릴까요?',['2년','3년','4년','5년'],3),
          mcc('common','1km는 몇 m일까요?',['100m','500m','1,000m','10,000m'],3),
          mcc('common','대한민국의 수도는?',['부산','서울','인천','대전'],2),
          mcc('common','어른의 뼈는 모두 몇 개일까요?',['106개','206개','306개','406개'],2),
          mcc('common','물은 1기압에서 몇 도에 끓을까요?',['50도','80도','100도','120도'],3),
          mcc('common','한 시간은 몇 분일까요?',['30분','60분','90분','100분'],2)
        ]},
        { id:'history', name:'한국사 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mcc('history','조선을 세운 사람은?',['이성계','왕건','김유신','궁예'],1),
          mcc('history','고려를 세운 사람은?',['이성계','왕건','견훤','궁예'],2),
          mcc('history','임진왜란이 일어난 해는?',['1392년','1492년','1592년','1692년'],3),
          mcc('history','3·1 운동이 일어난 해는?',['1909년','1919년','1929년','1945년'],2),
          mcc('history','광복절은 몇 월 며칠일까요?',['3월 1일','6월 25일','8월 15일','10월 3일'],3),
          mcc('history','한글날은 몇 월 며칠일까요?',['10월 3일','10월 9일','9월 9일','11월 9일'],2),
          mcc('history','삼국시대에 속하지 않는 나라는?',['고구려','백제','신라','고려'],4),
          mcc('history','광개토대왕의 아들로 고구려의 전성기를 이은 왕은?',['장수왕','소수림왕','무열왕','근초고왕'],1),
          mcc('history','대한민국 정부가 수립된 해는?',['1945년','1948년','1950년','1953년'],2),
          mcc('history','6·25 전쟁이 시작된 해는?',['1945년','1948년','1950년','1953년'],3)
        ]},
        { id:'science', name:'과학 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mcc('science','지구에서 가장 가까운 별은?',['달','태양','북극성','시리우스'],2),
          mcc('science','물의 화학식은?',['CO2','H2O','O2','NaCl'],2),
          mcc('science','식물이 광합성을 할 때 내보내는 기체는?',['산소','질소','수소','이산화탄소'],1),
          mcc('science','소리가 전달되지 않는 곳은?',['물속','공기 중','진공','쇠막대 속'],3),
          mcc('science','사람의 심장은 몇 개의 방으로 이루어져 있을까요?',['2개','3개','4개','5개'],3),
          mcc('science','가장 가벼운 기체는?',['산소','수소','헬륨','질소'],2),
          mcc('science','번개가 친 뒤 천둥소리가 늦게 들리는 이유는?',['빛이 소리보다 빠르다','소리가 빛보다 빠르다','둘의 속도가 같다','구름이 소리를 막는다'],1),
          mcc('science','자석의 같은 극끼리는 어떻게 될까요?',['끌어당긴다','밀어낸다','아무 일 없다','녹아 붙는다'],2),
          mcc('science','우리 몸에서 가장 큰 장기는?',['간','폐','피부','위'],3),
          mcc('science','달이 지구를 한 바퀴 도는 데 걸리는 시간은 대략?',['1주','약 한 달','약 6개월','1년'],2)
        ]},
        { id:'capital', name:'세계 수도 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mcc('capital','일본의 수도는?',['오사카','도쿄','교토','나고야'],2),
          mcc('capital','프랑스의 수도는?',['파리','리옹','마르세유','니스'],1),
          mcc('capital','영국의 수도는?',['맨체스터','리버풀','런던','에든버러'],3),
          mcc('capital','미국의 수도는?',['뉴욕','워싱턴 D.C.','로스앤젤레스','시카고'],2),
          mcc('capital','이탈리아의 수도는?',['밀라노','베네치아','피렌체','로마'],4),
          mcc('capital','독일의 수도는?',['뮌헨','베를린','함부르크','프랑크푸르트'],2),
          mcc('capital','중국의 수도는?',['상하이','베이징','홍콩','광저우'],2),
          mcc('capital','태국의 수도는?',['방콕','푸껫','치앙마이','파타야'],1),
          mcc('capital','호주의 수도는?',['시드니','멜버른','캔버라','브리즈번'],3),
          mcc('capital','캐나다의 수도는?',['토론토','밴쿠버','몬트리올','오타와'],4)
        ]},
        { id:'idiom', name:'사자성어 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          sj('일석( )',['이조','삼조','이득','일조'],1), sj('십시일( )',['번','판','반','만'],3), sj('우공이( )',['천','산','해','곡'],2), sj('오리무( )',['심','동','정','중'],4), sj('동고동( )',['낙','락','행','고'],2),
          sj('새옹지( )',['우','양','견','마'],4), sj('전화위( )',['복','부','행','락'],1), sj('타산지( )',['산','암','석','옥'],3), sj('유비무( )',['한','해','난','환'],4), sj('각주구( )',['도','검','창','궁'],2)
        ]},
        { id:'spelling', name:'맞춤법 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mcc('spelling','올바른 표현은?',['몇 일','며칠'],2),
          mcc('spelling','올바른 표현은? "그렇게 하면 ( )."',['되요','돼요'],2),
          mcc('spelling','올바른 표현은?',['설레임','설렘'],2),
          mcc('spelling','올바른 표현은? "( ) 기분이 좋아"',['왠지','웬지'],1),
          mcc('spelling','올바른 표현은? "( ) 도착했어요"',['금새','금세'],2),
          mcc('spelling','올바른 표현은? "감기가 다 ( )."',['낳았다','나았다'],2),
          mcc('spelling','올바른 표현은?',['어이없다','어의없다'],1),
          mcc('spelling','올바른 표현은?',['희안하다','희한하다'],2),
          mcc('spelling','올바른 표현은?',['갯수','개수'],2),
          mcc('spelling','올바른 표현은? "( ) 만났네요"',['오랫만에','오랜만에'],2)
        ]},
        { id:'animal', name:'동물 퀴즈', desc:'10문제 · 보기 중 고르기', questions:[
          mcc('animal','목이 가장 긴 동물은?',['코끼리','기린','낙타','타조'],2),
          mcc('animal','가장 빠른 육상 동물은?',['사자','말','치타','타조'],3),
          mcc('animal','개구리는 어떤 동물에 속할까요?',['포유류','파충류','양서류','조류'],3),
          mcc('animal','박쥐는 어떤 동물에 속할까요?',['조류','포유류','곤충','파충류'],2),
          mcc('animal','거미의 다리는 몇 개일까요?',['6개','8개','10개','12개'],2),
          mcc('animal','곤충의 다리는 몇 개일까요?',['4개','6개','8개','10개'],2),
          mcc('animal','펭귄이 많이 사는 곳은?',['북극','남극','사막','열대 우림'],2),
          mcc('animal','낙타의 혹에 저장된 것은?',['물','지방','공기','뼈'],2),
          mcc('animal','꿀벌이 만드는 것은?',['꿀','우유','실','비단'],1),
          mcc('animal','코알라가 주로 먹는 잎은?',['대나무','유칼립투스','상추','솔잎'],2)
        ]}
      ]},
    { id:'reaction', name:'반응 탭', desc:'휴대폰에 도형이 빠르게 지나가요. 정해진 도형이 나오는 순간 가장 먼저 탭!',
      sets:[
        { id:'react5', name:'반응 탭 5라운드', desc:'5라운드 · 도형과 색 24가지 중 하나 찾기', questions:[
          react('star','red','빨간 별'), react('square','blue','파란 네모'), react('triangle','black','검은 세모'),
          react('circle','green','초록 동그라미'), react('clover','red','빨간 클로버')
        ]}
      ]},
    { id:'number', name:'숫자 맞추기', desc:'숫자를 맞히는 문제예요. 정답에 가까운 숫자를 쓴 사람이 높은 점수를 받아요.',
      sets:[
        { id:'sense', name:'상식 숫자 퀴즈', desc:'8문제 · 숫자 쓰기', questions:[
          num('한라산의 높이는 몇 m일까요?', 1947, 'm'),
          num('에베레스트산의 높이는 약 몇 m일까요?', 8849, 'm'),
          num('지구를 한 바퀴 도는 거리(적도 둘레)는 약 몇 km일까요?', 40075, 'km'),
          num('피아노 건반은 모두 몇 개일까요?', 88, '개'),
          num('어른 몸의 뼈는 모두 몇 개일까요?', 206, '개'),
          num('마라톤 풀코스는 몇 km일까요? (소수점 포함)', 42.195, 'km'),
          num('지구에서 달까지 평균 거리는 약 몇 km일까요?', 384400, 'km'),
          num('사랑니를 포함한 어른의 이는 모두 몇 개일까요?', 32, '개')
        ]},
        { id:'korea', name:'우리나라 숫자 퀴즈', desc:'7문제 · 숫자 쓰기', questions:[
          num('한라산의 높이는 몇 m일까요?', 1947, 'm'),
          num('우리나라에는 도(道)가 모두 몇 개 있을까요? (특별자치도 포함)', 9, '개'),
          num('우리나라 광역시는 모두 몇 개일까요?', 6, '개'),
          num('한글의 기본 자음은 모두 몇 개일까요?', 14, '개'),
          num('한글의 기본 모음은 모두 몇 개일까요?', 10, '개'),
          num('태극기에는 괘가 모두 몇 개 있을까요?', 4, '개'),
          num('우리나라 국경일은 3·1절, 제헌절, 광복절, 개천절, 한글날 모두 몇 개일까요?', 5, '개')
        ]},
        { id:'life', name:'생활·시간 숫자 퀴즈', desc:'6문제 · 숫자 쓰기', questions:[
          num('하루는 몇 분일까요?', 1440, '분'),
          num('1시간은 몇 초일까요?', 3600, '초'),
          num('1년(365일)은 몇 시간일까요?', 8760, '시간'),
          num('일주일은 몇 시간일까요?', 168, '시간'),
          num('1년은 약 몇 주일까요?', 52, '주'),
          num('달걀 한 판은 보통 몇 개일까요?', 30, '개')
        ]},
        { id:'nature', name:'동물·자연 숫자 퀴즈', desc:'7문제 · 숫자 쓰기', questions:[
          num('거미의 다리는 모두 몇 개일까요?', 8, '개'),
          num('곤충의 다리는 모두 몇 개일까요?', 6, '개'),
          num('오징어의 다리(팔 포함)는 모두 몇 개일까요?', 10, '개'),
          num('기린의 목뼈는 모두 몇 개일까요?', 7, '개'),
          num('지구의 큰 바다 오대양에서 대양은 모두 몇 개일까요?', 5, '개'),
          num('눈 결정은 꼭짓점이 모두 몇 개인 모양일까요?', 6, '개'),
          num('무지개는 보통 몇 가지 색으로 말할까요?', 7, '가지')
        ]},
        { id:'space', name:'우주·과학 숫자 퀴즈', desc:'7문제 · 숫자 쓰기', questions:[
          num('태양계의 행성은 모두 몇 개일까요?', 8, '개'),
          num('빛의 속도는 1초에 약 몇 km일까요?', 299792, 'km'),
          num('태양 빛이 지구에 오는 데 약 몇 분 걸릴까요?', 8, '분'),
          num('지구가 태양을 한 바퀴 도는 데 약 며칠 걸릴까요?', 365, '일'),
          num('물은 1기압에서 몇 도에 끓을까요?', 100, '도'),
          num('주기율표에 이름이 붙은 원소는 모두 몇 개일까요?', 118, '개'),
          num('지구에서 달까지 평균 거리는 약 몇 km일까요?', 384400, 'km')
        ]},
        { id:'body', name:'몸·건강 숫자 퀴즈', desc:'6문제 · 숫자 쓰기', questions:[
          num('어른 몸의 뼈는 모두 몇 개일까요?', 206, '개'),
          num('사랑니를 포함한 어른의 이는 모두 몇 개일까요?', 32, '개'),
          num('갈비뼈는 모두 몇 개일까요? (양쪽 합계)', 24, '개'),
          num('사람의 심장은 몇 개의 방으로 이루어져 있을까요?', 4, '개'),
          num('사람의 정상 체온은 약 몇 도일까요?', 36.5, '도'),
          num('사람의 목뼈(경추)는 모두 몇 개일까요?', 7, '개')
        ]}
      ]},
    { id:'mash', name:'연타 배틀', desc:'휴대폰을 마구 눌러요. 많이 누르기와 감으로 10초 맞추기!',
      sets:[
        { id:'mash3', name:'연타 배틀 3라운드', desc:'1) 10초 연타 2) 감으로 10초 3) 10초 연타', questions:[ mash(10), mashT(), mash(10) ] },
        { id:'mashA', name:'연타 왕중왕전', desc:'5라운드 · 연타와 감으로 10초를 섞어서', questions:[ mash(10), mashT(), mash(7), mashT(), mash(10) ] }
      ]},
    { id:'match', name:'이구동성', desc:'같은 질문에 보기 중 하나를 탭해요. 다른 사람과 답이 겹치면 점수를 받아요.',
      sets:[
        { id:'match8', name:'떠오르는 단어 맞히기', desc:'8문제 · 보기 탭하기', questions:[
          mt('라면 먹을 때 꼭 같이 먹는 음식은?',['김치','단무지','계란','밥']), mt('치킨 먹을 때 꼭 같이 마시는 음료는?',['콜라','맥주','사이다','물']),
          mt('여름 하면 떠오르는 과일은?',['수박','참외','복숭아','포도']), mt('겨울 하면 떠오르는 간식은?',['붕어빵','군고구마','호떡','어묵']),
          mt('국내 여행지 하면 떠오르는 곳은?',['제주도','부산','강릉','경주']), mt('빨간색 하면 떠오르는 것은?',['사과','소방차','딸기','신호등']),
          mt('동물 하면 가장 먼저 떠오르는 동물은?',['강아지','고양이','사자','호랑이']), mt('우리나라 하면 떠오르는 음식은?',['김치','비빔밥','불고기','떡볶이'])
        ]},
        { id:'mfood', name:'음식 이구동성', desc:'7문제 · 보기 탭하기', questions:[
          mt('야식 하면 가장 먼저 떠오르는 음식은?',['치킨','라면','피자','족발']), mt('비 오는 날 생각나는 음식은?',['파전','칼국수','짬뽕','수제비']),
          mt('소풍 도시락 하면 떠오르는 음식은?',['김밥','유부초밥','샌드위치','주먹밥']), mt('분식집 하면 떠오르는 메뉴는?',['떡볶이','순대','튀김','어묵']),
          mt('고기 먹을 때 빠질 수 없는 것은?',['쌈장','마늘','상추','김치']), mt('아이스크림 하면 떠오르는 맛은?',['바닐라','초코','딸기','민트초코']),
          mt('피자 하면 떠오르는 토핑은?',['페퍼로니','치즈','파인애플','불고기'])
        ]},
        { id:'mtravel', name:'여행 이구동성', desc:'6문제 · 보기 탭하기', questions:[
          mt('바다 하면 떠오르는 것은?',['파도','갈매기','모래사장','수영복']), mt('여행 가방에 꼭 챙기는 것은?',['충전기','여권','세면도구','간식']),
          mt('여행 가서 가장 먼저 하는 일은?',['맛집 가기','숙소 짐 풀기','사진 찍기','산책']), mt('해외여행 하면 떠오르는 나라는?',['일본','미국','프랑스','태국']),
          mt('캠핑 하면 떠오르는 것은?',['모닥불','텐트','고기','별']), mt('기차 여행 하면 떠오르는 간식은?',['삶은 계란','사이다','과자','김밥'])
        ]},
        { id:'mwork', name:'학교·회사 이구동성', desc:'6문제 · 보기 탭하기', questions:[
          mt('월요일 하면 떠오르는 기분은?',['피곤','우울','출근하기 싫어','커피']), mt('점심시간 하면 떠오르는 것은?',['메뉴 고민','낮잠','구내식당','산책']),
          mt('학교 하면 떠오르는 것은?',['교복','급식','시험','운동장']), mt('회사 하면 떠오르는 것은?',['야근','회의','커피','월급']),
          mt('금요일 하면 떠오르는 것은?',['퇴근','치맥','주말','약속']), mt('방학 하면 떠오르는 것은?',['늦잠','숙제','여행','게임'])
        ]},
        { id:'mlove', name:'연애·가족 이구동성', desc:'6문제 · 보기 탭하기', questions:[
          mt('첫 데이트 장소 하면 떠오르는 곳은?',['영화관','카페','맛집','공원']), mt('연인에게 받고 싶은 선물은?',['편지','꽃','명품','여행']),
          mt('명절 하면 떠오르는 것은?',['송편','세뱃돈','윷놀이','잔소리']), mt('엄마 하면 떠오르는 말은?',['밥 먹었니','공부해','일찍 자','사랑해']),
          mt('가족 외식 하면 떠오르는 메뉴는?',['고기','회','한정식','중식']), mt('집에서 가장 편한 곳은?',['침대','소파','거실 바닥','화장실'])
        ]},
        { id:'mseason', name:'계절·날씨 이구동성', desc:'6문제 · 보기 탭하기', questions:[
          mt('봄 하면 떠오르는 것은?',['벚꽃','미세먼지','소풍','졸음']), mt('여름 하면 떠오르는 것은?',['바다','에어컨','장마','빙수']),
          mt('가을 하면 떠오르는 것은?',['단풍','독서','선선한 바람','송편']), mt('겨울 하면 떠오르는 것은?',['눈','귤','붕어빵','패딩']),
          mt('비 오는 날 하면 떠오르는 것은?',['우산','파전','침대','커피']), mt('눈 오는 날 하면 떠오르는 것은?',['눈사람','빙판길','커피','크리스마스'])
        ]}
      ]},
    { id:'shuffle', name:'간식 먹은 탭탭이', desc:'탭탭이 4마리 중 한 마리가 간식을 먹고, 서로 자리를 바꿔요. 멈췄을 때 간식 먹은 탭탭이를 찾아요.',
      sets:[
        { id:'shuf3', name:'탭탭이 찾기 3라운드', desc:'3라운드 · 점점 빨라져요', questions:[ shuf(6,650), shuf(9,480), shuf(12,360) ] }
      ]},
    { id:'diff', name:'다른 탭탭이 찾기', desc:'똑같이 생긴 탭탭이들 사이에서 하나만 다른 탭탭이를 가장 빨리 찾아요.',
      sets:[
        { id:'diff3', name:'다른 탭탭이 3라운드', desc:'3라운드 · 점점 많아지고 어려워져요', questions:[ dif(3,'acc'), dif(4,'acc'), dif(5,'color') ] }
      ]},
    { id:'memory', name:'기억력 패턴', desc:'불이 켜지는 순서를 외웠다가 똑같이 눌러요. 중간에 틀려도 맞힌 만큼 점수를 받아요.',
      sets:[ { id:'mem3', name:'기억력 패턴 3라운드', desc:'3라운드 · 점점 길어져요', questions:[ mem(3,4), mem(3,6), mem(4,8) ] } ]},
    { id:'tapnum', name:'순서 터치', desc:'흩어진 숫자·알파벳·한글을 순서대로 가장 빨리 눌러요.',
      sets:[ { id:'tnum4', name:'순서 터치 4라운드', desc:'숫자 1~9 → 알파벳 → 한글 → 숫자 1~16', questions:[
        tnum('num',9,'1부터 9까지 순서대로 눌러요!'), tnum('abc',12,'알파벳 A부터 L까지 순서대로 눌러요!'), tnum('ko',12,'가나다 순서대로 눌러요!'), tnum('num',16,'1부터 16까지 순서대로 눌러요!') ] } ]},
    { id:'cardpos', name:'카드 위치 기억', desc:'탭탭이 카드를 잠깐 보여준 뒤 뒤집어요. 어디에 있었는지 맞혀요.',
      sets:[ { id:'cpos3', name:'카드 위치 기억 3라운드', desc:'3라운드 · 카드가 점점 많아져요', questions:[ cpos(3,2,3500), cpos(4,2,3500), cpos(4,3,4500) ] } ]},
    { id:'nunchi', name:'눈치게임', desc:'숫자를 하나 골라요. 다른 사람과 겹치면 0점! 혼자 고른 가장 작은 숫자가 이겨요.',
      sets:[ { id:'nun5', name:'눈치게임 5라운드', desc:'5라운드 · 겹치지 않게 눈치껏', questions:[ nun(), nun(), nun(), nun(), nun() ] } ]},
    { id:'calc', name:'빠른 계산', desc:'간단한 계산 문제를 가장 빨리 푼 사람이 높은 점수를 받아요.',
      sets:[
        { id:'calc_easy', name:'쉬운 계산 (덧셈·뺄셈)', desc:'8문제 · 직접 쓰기', questions:[ calc('7 + 5 = ?',12), calc('9 + 8 = ?',17), calc('15 - 6 = ?',9), calc('20 - 13 = ?',7), calc('12 + 14 = ?',26), calc('30 - 18 = ?',12), calc('25 + 25 = ?',50), calc('41 - 9 = ?',32) ] },
        { id:'calc8', name:'암산 8문제 (보통)', desc:'8문제 · 직접 쓰기', questions:[ calc('17 + 26 = ?',43), calc('84 - 37 = ?',47), calc('6 × 7 = ?',42), calc('9 × 8 = ?',72), calc('125 + 78 = ?',203), calc('100 - 46 = ?',54), calc('12 × 5 = ?',60), calc('144 ÷ 12 = ?',12) ] },
        { id:'calc_hard', name:'어려운 계산', desc:'8문제 · 직접 쓰기', questions:[ calc('48 + 79 = ?',127), calc('153 - 68 = ?',85), calc('36 + 47 + 18 = ?',101), calc('200 - 57 - 38 = ?',105), calc('15 × 12 = ?',180), calc('13 × 14 = ?',182), calc('96 ÷ 8 + 17 = ?',29), calc('7 × 8 - 19 = ?',37) ] },
        { id:'calc_mul', name:'곱셈·나눗셈 계산', desc:'8문제 · 직접 쓰기', questions:[ calc('6 × 8 = ?',48), calc('7 × 9 = ?',63), calc('12 × 12 = ?',144), calc('72 ÷ 9 = ?',8), calc('81 ÷ 3 = ?',27), calc('25 × 4 = ?',100), calc('15 × 6 = ?',90), calc('132 ÷ 11 = ?',12) ] }
      ]},
    { id:'stroop', name:'색깔 맞추기', desc:'글자의 뜻이 아니라 글자의 색깔을 골라요. 눈과 뇌가 헷갈려요!',
      sets:[
        { id:'stroop8', name:'기본 글자색 8문제', desc:'8문제 · 4가지 색', questions:[ strp('빨강','파랑'), strp('파랑','초록'), strp('초록','빨강'), strp('노랑','파랑'), strp('빨강','노랑'), strp('초록','노랑'), strp('파랑','빨강'), strp('노랑','초록') ] },
        { id:'stroop12', name:'빠르게 글자색 12문제', desc:'12문제 · 4가지 색, 쉬지 않고 쭉', questions:[ strp('빨강','초록'), strp('파랑','노랑'), strp('노랑','빨강'), strp('초록','파랑'), strp('빨강','파랑'), strp('초록','노랑'), strp('파랑','빨강'), strp('노랑','초록'), strp('빨강','노랑'), strp('파랑','초록'), strp('초록','빨강'), strp('노랑','파랑') ] },
        { id:'stroop6', name:'어려운 글자색 (6가지 색)', desc:'8문제 · 주황·보라까지 6가지 색', questions:[ strp('주황','보라',1), strp('보라','주황',1), strp('빨강','주황',1), strp('노랑','보라',1), strp('초록','주황',1), strp('파랑','보라',1), strp('주황','초록',1), strp('보라','노랑',1) ] }
      ]},
    { id:'balance', name:'밸런스 게임', desc:'두 가지 중에 하나를 골라요. 정답은 없고, 다른 사람들은 뭘 골랐는지 바로 보여줘요.',
      sets:[
        { id:'food', name:'음식 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('짜장면','짬뽕'), bal('민트초코','반민초'), bal('부먹','찍먹'), bal('후라이드','양념'), bal('물냉면','비빔냉면'), bal('치킨','피자')
        ]},
        { id:'life', name:'일상 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('여름','겨울'), bal('산','바다'), bal('아침형 인간','저녁형 인간'), bal('강아지','고양이'), bal('집콕','밖에 나가기'), bal('여행은 계획형','여행은 즉흥형')
        ]},
        { id:'love', name:'연애 밸런스', desc:'7문제 · 정답 없이 투표', questions:[
          bal('연락 자주 하는 연인','연락 뜸한 연인'), bal('매일 데이트','주 1회 데이트'), bal('깜짝 이벤트 받기','깜짝 이벤트 해주기'), bal('전 애인과 친구 가능','절대 불가'),
          bal('나보다 잘생긴 연인','나보다 성격 좋은 연인'), bal('기념일 챙기는 연인','기념일 신경 안 쓰는 연인'), bal('고백은 내가','고백은 상대가')
        ]},
        { id:'work', name:'직장 밸런스', desc:'7문제 · 정답 없이 투표', questions:[
          bal('월급 2배, 야근 매일','월급 그대로, 칼퇴'), bal('재택근무','사무실 출근'), bal('좋은 동료, 낮은 월급','나쁜 동료, 높은 월급'), bal('회식 주 1회','회식 없는 회사'),
          bal('점심 혼자','점심 팀원과 함께'), bal('연차 자유롭게','월급 10% 인상'), bal('일 많고 빨리 승진','일 적고 승진 느림')
        ]},
        { id:'school', name:'학창시절 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('시험 없는 학교','숙제 없는 학교'), bal('급식','도시락'), bal('교복 입는 학교','자율복 학교'), bal('체육 시간 늘리기','점심시간 늘리기'),
          bal('짝꿍 자유 선택','자리 랜덤 배정'), bal('수학여행 국내','수학여행 해외')
        ]},
        { id:'power', name:'초능력 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('하늘을 나는 능력','투명인간 되는 능력'), bal('시간 멈추기','시간 되감기'), bal('모든 언어 말하기','모든 동물과 대화'), bal('순간이동','마음 읽기'),
          bal('평생 안 아픈 몸','평생 안 졸린 몸'), bal('미래 보기','과거 보기')
        ]},
        { id:'trip', name:'여행 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('국내 여행','해외 여행'), bal('바다 여행','산 여행'), bal('호텔 숙박','캠핑'), bal('맛집 투어','관광지 투어'),
          bal('계획 꼼꼼히','발길 닿는 대로'), bal('비행기','기차')
        ]},
        { id:'family', name:'가족 모임 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('명절에 집에서 요리','명절에 외식'), bal('큰 집에 모두 모이기','각자 집에서 영상통화'), bal('용돈 받기','용돈 주기'), bal('어릴 적 사진 공개','어릴 적 영상 공개'),
          bal('고기 파티','회 파티'), bal('가족 여행 계획은 엄마','가족 여행 계획은 아빠')
        ]}
      ]},
    { id:'raffle', name:'행운권 추첨', desc:'미리 등록한 상품을 슬롯머신처럼 돌려서 참가자 중에 뽑아요. 당첨되면 휴대폰에 "당첨!"이 떠요.',
      sets:[ { id:'raffle1', name:'행운권 추첨', desc:'상품은 시작 화면에서 등록해요', questions:[ party('raffle','행운권 추첨') ] } ]},
    { id:'wheel', name:'돌림판', desc:'방장이 적은 항목으로 돌림판을 돌려서 하나를 뽑아요. 벌칙·점심 메뉴 정하기에 딱!',
      sets:[ { id:'wheel1', name:'돌림판', desc:'항목은 시작 화면에서 적어요', questions:[ party('wheel','돌림판') ] } ]},
    { id:'ladder', name:'사다리 타기', desc:'참가자가 휴대폰으로 줄을 고르고, 방장이 적은 결과가 사다리로 정해져요.',
      sets:[ { id:'ladder1', name:'사다리 타기', desc:'결과는 시작 화면에서 적어요', questions:[ party('ladder','사다리 타기') ] } ]},
    { id:'order', name:'순서 정하기', desc:'버튼 한 번으로 모두의 순서를 무작위로 정해요. 발표·게임 순서 정할 때!',
      sets:[ { id:'order1', name:'순서 정하기', desc:'바로 시작', questions:[ party('order','순서 정하기') ] } ]},
    { id:'liar', name:'라이어 게임', desc:'모두에게 제시어가 있는데 라이어만 몰라요. 말로 설명하다가 투표로 라이어를 찾아요.',
      sets:[ { id:'liar1', name:'라이어 게임 1판', desc:'1판 · 카테고리 선택', questions:[ party('liar','라이어 게임') ] },
             { id:'liar3', name:'라이어 게임 3판', desc:'3판 · 판마다 새 제시어', questions:[ party('liar','라이어 게임 1판'), party('liar','라이어 게임 2판'), party('liar','라이어 게임 3판') ] } ]},
    { id:'draw', name:'도형 그리기', desc:'큰 화면의 도형을 보고 휴대폰에 손가락으로 그려요. 가장 비슷하게 그린 사람이 1등!',
      sets:[ { id:'draw3', name:'도형 그리기 3라운드', desc:'원 → 삼각형 → 하트', questions:[ party('draw','동그라미 그리기',{shape:'circle',sec:15}), party('draw','삼각형 그리기',{shape:'triangle',sec:15}), party('draw','하트 그리기',{shape:'heart',sec:20}) ] } ]},
    { id:'rps', name:'가위바위보 서바이벌', desc:'컴퓨터를 이긴 사람만 살아남아요. 마지막 2명은 결승 대결!',
      sets:[ { id:'rps1', name:'가위바위보 서바이벌', desc:'바로 시작', questions:[ party('rps','가위바위보 서바이벌') ] } ]},
    { id:'rhythm', name:'리듬 탭', desc:'빨강·파랑 동그라미가 선에 닿을 때 같은 색 버튼을 눌러요. 정확할수록 높은 점수!',
      sets:[ { id:'rhythm1', name:'리듬 탭 1판', desc:'약 25초', questions:[ party('rhythm','리듬 탭') ] },
             { id:'rhythm3', name:'리듬 탭 3판', desc:'3판 · 판마다 다른 박자', questions:[ party('rhythm','리듬 탭 1판'), party('rhythm','리듬 탭 2판'), party('rhythm','리듬 탭 3판') ] } ]},
    { id:'run', name:'50m 달리기', desc:'탭탭이가 저절로 달려요. 버튼으로 장애물을 피해서 50m에 먼저 도착하면 1등!',
      sets:[ { id:'run1', name:'50m 달리기 1판', desc:'약 25초', questions:[ party('run','50m 달리기') ] },
             { id:'run3', name:'50m 달리기 3판', desc:'3판 · 판마다 다른 장애물', questions:[ party('run','50m 달리기 1판'), party('run','50m 달리기 2판'), party('run','50m 달리기 3판') ] } ]},
    { id:'claw', name:'탭탭이 뽑기', desc:'집게가 지나갈 때 "잡기!"를 눌러요. 작은 탭탭이일수록 점수가 높아요.',
      sets:[ { id:'claw1', name:'탭탭이 뽑기 1판', desc:'3번 뽑기', questions:[ party('claw','탭탭이 뽑기') ] },
             { id:'claw2', name:'탭탭이 뽑기 2판', desc:'3번씩 2판', questions:[ party('claw','탭탭이 뽑기 1판'), party('claw','탭탭이 뽑기 2판') ] } ]},
    { id:'dart', name:'풍선 다트', desc:'가로 한 번, 세로 한 번 눌러 조준해요. 20초 동안 풍선을 많이 터뜨리면 1등!',
      sets:[ { id:'dart1', name:'풍선 다트 1판', desc:'20초', questions:[ party('dart','풍선 다트') ] },
             { id:'dart2', name:'풍선 다트 2판', desc:'20초씩 2판', questions:[ party('dart','풍선 다트 1판'), party('dart','풍선 다트 2판') ] } ]},
    { id:'rope', name:'단체 줄넘기', desc:'줄이 올 때 "점프!"를 눌러요. 걸리면 탈락, 가장 오래 버틴 사람이 1등!',
      sets:[ { id:'rope1', name:'단체 줄넘기 1판', desc:'줄이 점점 빨라져요', questions:[ party('rope','단체 줄넘기') ] },
             { id:'rope2', name:'단체 줄넘기 2판', desc:'2판', questions:[ party('rope','단체 줄넘기 1판'), party('rope','단체 줄넘기 2판') ] } ]},
    { id:'pump', name:'풍선 불기', desc:'불수록 점수가 커지지만 터지면 0점! 터지기 전에 "그만!"을 눌러요.',
      sets:[ { id:'pump1', name:'풍선 불기 1판', desc:'풍선 3개', questions:[ party('pump','풍선 불기') ] },
             { id:'pump2', name:'풍선 불기 2판', desc:'풍선 3개씩 2판', questions:[ party('pump','풍선 불기 1판'), party('pump','풍선 불기 2판') ] } ]},
    { id:'tug', name:'팀 줄다리기', desc:'두 팀으로 나눠 "당겨!"를 연타해요. 깃발을 끝까지 끌어오면 승리! (개인전이면 자동으로 두 팀을 나눠요)',
      sets:[ { id:'tug1', name:'팀 줄다리기 1판', desc:'20초', questions:[ party('tug','팀 줄다리기') ] },
             { id:'tug3', name:'팀 줄다리기 3판', desc:'3판 2선승 느낌으로!', questions:[ party('tug','팀 줄다리기 1판'), party('tug','팀 줄다리기 2판'), party('tug','팀 줄다리기 3판') ] } ]},
    { id:'bomb', name:'폭탄 돌리기', desc:'폭탄을 옆 사람에게 넘기고 넘겨요. 터질 때 들고 있으면 벌칙!',
      sets:[ { id:'bomb1', name:'폭탄 돌리기 1판', desc:'1판', questions:[ party('bomb','폭탄 돌리기') ] },
             { id:'bomb3', name:'폭탄 돌리기 3판', desc:'3판 · 벌칙자가 누가 될까?', questions:[ party('bomb','폭탄 돌리기 1판'), party('bomb','폭탄 돌리기 2판'), party('bomb','폭탄 돌리기 3판') ] } ]}
  ];
})();
