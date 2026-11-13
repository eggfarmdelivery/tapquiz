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
      correct_answers:[String(correct)], time_limit:t||15 };
  }
  function mcc(cat, content, labels, correct){
    return { category:cat, qtype:'mcq', content:content,
      options: labels.map(function(l,i){ return {id:String(i+1), label:l}; }),
      correct_answers:[String(correct)], time_limit:15 };
  }
  function sj(q, ans){ return { category:'idiom', qtype:'text', content:'사자성어 완성: '+q, options:null, correct_answers:ans, time_limit:20 }; }
  function pv(content, ans){ return { category:'proverb', qtype:'text', content:content, options:null, correct_answers:ans, time_limit:20 }; }
  function ch(initial, hint, ans){ return { category:'initial', qtype:'text', content:'초성: '+initial+'  (힌트: '+hint+')', options:null, correct_answers:ans, time_limit:20 }; }
  function bal(a, b){ return { category:'balance', qtype:'vote', content:a+' vs '+b,
    options:[{id:'1',label:a},{id:'2',label:b}], correct_answers:null, time_limit:15 }; }
  function react(shape, color, ko){ return { category:'reaction', qtype:'reaction', content:ko+'이 나오면 탭!',
    options:{ targetShape:shape, targetColor:color, minDelay:1000, maxDelay:3000, minDecoys:3, maxDecoys:6, frameDuration:700 },
    correct_answers:null, time_limit:20 }; }

  function num(content, ans, unit){ return { category:'number', qtype:'number', content:content, options:{unit:unit||''}, correct_answers:[String(ans)], time_limit:30 }; }
  function mash(sec){ return { category:'mash', qtype:'mash', content:'휴대폰을 마구 눌러요!', options:{duration:sec*1000}, correct_answers:null, time_limit:sec+10 }; }
  function shuf(swaps, ms){ return { category:'shuffle', qtype:'shuffle', content:'간식을 먹은 탭탭이를 찾아라!', options:{swaps:swaps, stepMs:ms}, correct_answers:null, time_limit:30 }; }
  function dif(cols, mode){ return { category:'diff', qtype:'diff', content:'다른 탭탭이를 찾아라!', options:{cols:cols, mode:mode}, correct_answers:null, time_limit:25 }; }
  function mem(cols, len){ return { category:'memory', qtype:'memory', content:'불이 켜지는 순서를 기억하세요!', options:{cols:cols, len:len, step:800}, correct_answers:null, time_limit:30 }; }
  function tnum(n){ return { category:'tapnum', qtype:'tapnum', content:'1부터 순서대로 눌러요!', options:{n:n}, correct_answers:null, time_limit:30 }; }
  function cpos(cols, rows, ms){ return { category:'cardpos', qtype:'cardpos', content:'그림 카드의 위치를 기억하세요!', options:{cols:cols, rows:rows, showMs:ms}, correct_answers:null, time_limit:25 }; }
  function nun(){ return { category:'nunchi', qtype:'nunchi', content:'눈치껏 숫자를 고르세요! 겹치면 0점!', options:{}, correct_answers:null, time_limit:20 }; }
  function calc(q, a){ return { category:'calc', qtype:'text', content:q, options:null, correct_answers:[String(a)], time_limit:15 }; }
  var INK = { '빨강':'#FF4D4D', '파랑':'#4D8BFF', '초록':'#2FC96F', '노랑':'#FFD43B' };
  function strp(word, ink){ return { category:'stroop', qtype:'mcq', content:'글자의 색깔은? {{ink:'+INK[ink]+'}}'+word,
    options:['빨강','파랑','초록','노랑'].map(function(n,i){ return {id:String(i+1), label:n}; }), correct_answers:[String(['빨강','파랑','초록','노랑'].indexOf(ink)+1)], time_limit:10 }; }
  function mt(content, labels){ return { category:'match', qtype:'match', content:content, options:labels.map(function(l,i){ return {id:String(i+1), label:l}; }), correct_answers:null, time_limit:15 }; }

  window.TQ_GAMES = [
    { id:'quiz', name:'퀴즈', desc:'문제를 보고 답을 맞혀요. 빨리 맞힐수록 점수가 높아요.',
      sets:[
        { id:'proverb', name:'속담 퀴즈', desc:'10문제 · 직접 쓰기', questions:[
          pv('가는 말이 고와야 오는 말이 ( )', ['곱다']),
          pv('소 잃고 ( ) 고친다', ['외양간']),
          pv('낮말은 새가 듣고 밤말은 ( )가 듣는다', ['쥐']),
          pv('아니 땐 굴뚝에 ( ) 날까', ['연기']),
          pv('티끌 모아 ( )', ['태산']),
          pv('원숭이도 ( )에서 떨어진다', ['나무']),
          pv('호랑이도 제 말 하면 ( )', ['온다','오지']),
          pv('고래 싸움에 ( ) 등 터진다', ['새우']),
          pv('백지장도 맞들면 ( )', ['낫다']),
          pv('열 길 물속은 알아도 한 길 ( ) 속은 모른다', ['사람'])
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
        { id:'idiom', name:'사자성어 퀴즈', desc:'10문제 · 직접 쓰기', questions:[
          sj('일석( )',['이조']), sj('십시일( )',['반']), sj('우공이( )',['산']), sj('오리무( )',['중']), sj('동고동( )',['락']),
          sj('새옹지( )',['마']), sj('전화위( )',['복']), sj('타산지( )',['석']), sj('유비무( )',['환']), sj('각주구( )',['검'])
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
        ]}
      ]},
    { id:'mash', name:'연타 배틀', desc:'정해진 시간 동안 휴대폰을 마구 눌러요. 가장 많이 누른 사람이 이겨요.',
      sets:[
        { id:'mash3', name:'연타 배틀 3라운드', desc:'3라운드 · 10초씩', questions:[ mash(10), mash(10), mash(10) ] }
      ]},
    { id:'match', name:'이구동성', desc:'같은 질문에 보기 중 하나를 탭해요. 다른 사람과 답이 겹치면 점수를 받아요.',
      sets:[
        { id:'match8', name:'떠오르는 단어 맞히기', desc:'8문제 · 보기 탭하기', questions:[
          mt('라면 먹을 때 꼭 같이 먹는 음식은?',['김치','단무지','계란','밥']), mt('치킨 먹을 때 꼭 같이 마시는 음료는?',['콜라','맥주','사이다','물']),
          mt('여름 하면 떠오르는 과일은?',['수박','참외','복숭아','포도']), mt('겨울 하면 떠오르는 간식은?',['붕어빵','군고구마','호떡','어묵']),
          mt('국내 여행지 하면 떠오르는 곳은?',['제주도','부산','강릉','경주']), mt('빨간색 하면 떠오르는 것은?',['사과','소방차','딸기','신호등']),
          mt('동물 하면 가장 먼저 떠오르는 동물은?',['강아지','고양이','사자','호랑이']), mt('우리나라 하면 떠오르는 음식은?',['김치','비빔밥','불고기','떡볶이'])
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
    { id:'memory', name:'기억력 패턴', desc:'불이 켜지는 순서를 외웠다가 똑같이 눌러요. 틀리면 0점이에요.',
      sets:[ { id:'mem3', name:'기억력 패턴 3라운드', desc:'3라운드 · 점점 길어져요', questions:[ mem(3,4), mem(3,6), mem(4,8) ] } ]},
    { id:'tapnum', name:'숫자 순서 터치', desc:'흩어진 숫자를 1부터 차례로 가장 빨리 눌러요.',
      sets:[ { id:'tnum3', name:'숫자 순서 터치 3라운드', desc:'3라운드 · 9개 → 12개 → 16개', questions:[ tnum(9), tnum(12), tnum(16) ] } ]},
    { id:'cardpos', name:'카드 위치 기억', desc:'그림 카드를 잠깐 보여준 뒤 뒤집어요. 어디에 있었는지 맞혀요.',
      sets:[ { id:'cpos3', name:'카드 위치 기억 3라운드', desc:'3라운드 · 카드가 점점 많아져요', questions:[ cpos(3,2,3500), cpos(4,2,3500), cpos(4,3,3500) ] } ]},
    { id:'nunchi', name:'눈치게임', desc:'숫자를 하나 골라요. 다른 사람과 겹치면 0점! 혼자 고른 가장 작은 숫자가 이겨요.',
      sets:[ { id:'nun5', name:'눈치게임 5라운드', desc:'5라운드 · 겹치지 않게 눈치껏', questions:[ nun(), nun(), nun(), nun(), nun() ] } ]},
    { id:'calc', name:'빠른 계산', desc:'간단한 계산 문제를 가장 빨리 푼 사람이 높은 점수를 받아요.',
      sets:[ { id:'calc8', name:'암산 8문제', desc:'8문제 · 직접 쓰기', questions:[ calc('17 + 26 = ?',43), calc('84 - 37 = ?',47), calc('6 × 7 = ?',42), calc('9 × 8 = ?',72), calc('125 + 78 = ?',203), calc('100 - 46 = ?',54), calc('12 × 5 = ?',60), calc('144 ÷ 12 = ?',12) ] } ]},
    { id:'stroop', name:'색깔 맞추기', desc:'글자의 뜻이 아니라 글자의 색깔을 골라요. 눈과 뇌가 헷갈려요!',
      sets:[ { id:'stroop8', name:'글자색 8문제', desc:'8문제 · 보기 고르기', questions:[ strp('빨강','파랑'), strp('파랑','초록'), strp('초록','빨강'), strp('노랑','파랑'), strp('빨강','노랑'), strp('초록','노랑'), strp('파랑','빨강'), strp('노랑','초록') ] } ]},
    { id:'balance', name:'밸런스 게임', desc:'두 가지 중에 하나를 골라요. 정답은 없고, 다른 사람들은 뭘 골랐는지 바로 보여줘요.',
      sets:[
        { id:'food', name:'음식 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('짜장면','짬뽕'), bal('민트초코','반민초'), bal('부먹','찍먹'), bal('후라이드','양념'), bal('물냉면','비빔냉면'), bal('치킨','피자')
        ]},
        { id:'life', name:'일상 밸런스', desc:'6문제 · 정답 없이 투표', questions:[
          bal('여름','겨울'), bal('산','바다'), bal('아침형 인간','저녁형 인간'), bal('강아지','고양이'), bal('집콕','밖에 나가기'), bal('여행은 계획형','여행은 즉흥형')
        ]}
      ]}
  ];
})();
