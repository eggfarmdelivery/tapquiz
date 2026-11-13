# 탭퀴즈 (TapQuiz) 1차

로그인 없는 실시간 퀴즈/게임. 방장은 노트북(큰 화면), 참가자는 QR로 휴대폰 접속.

## 파일
- index.html 시작 / host.html 방장 / player.html 참가자 / terms.html, privacy.html (초안)
- config.js 에 Supabase URL, anon key 입력 (service_role 키는 절대 넣지 마세요)
- presets.js 추천 문제, jelly.js 캐릭터, common.css 공통 스타일, schema.sql (DB, 변경 없음)

## 설치
1. Supabase SQL Editor에서 schema.sql 실행 (기존 DB가 있으면 재실행 불필요)
2. config.js 수정
3. GitHub Pages(zerosearch.kr/tapquiz)에 파일 그대로 업로드
4. 방 24시간 자동 삭제: pg_cron 설정은 기존 안내대로

## 1차 게임
퀴즈(속담/초성/가족), 반응 탭, 숫자 맞추기, 연타 배틀, 이구동성, 간식 먹은 탭탭이(shuffle.js), 다른 탭탭이 찾기, 기억력 패턴/숫자 순서 터치/카드 위치 기억/눈치게임(minigames.js), 빠른 계산, 색깔 맞추기, 밸런스 게임(음식/일상). 직접 문제는 방장 브라우저(localStorage)에 저장.
반응 탭: reaction_sequence = {readyUntil, frames[]}, 마지막 프레임이 정답 도형. 기기 시계 차이로 도형 표시 시점이 조금 어긋날 수 있음(반응 시간은 각 기기에서 측정).

## 알려진 한계 / 다음 단계
- RLS 전체 공개, 정답이 클라이언트에서 읽힘(MVP), 게임 중간 입장 불가
- 2차: 숫자 맞추기, 연타 배틀, 이구동성, 줄다리기 단어전, "간단하게" 템플릿 편집
- 약관/개인정보 문서는 광고 전 검토 필요
