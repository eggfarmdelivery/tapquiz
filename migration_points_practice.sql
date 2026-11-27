-- 탭퀴즈: 문제별 배점 / 연습 문제 기능 추가 (한 번만 실행)
-- Supabase > SQL Editor 에 붙여넣고 Run
alter table questions add column if not exists points int;
alter table questions add column if not exists is_practice boolean default false;
