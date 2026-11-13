-- ============================================
-- 실시간 퀴즈쇼 MVP - Supabase 스키마
-- Supabase 프로젝트 > SQL Editor 에서 전체 실행하세요.
-- ============================================

-- 1. 방 (room)
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  pin text unique not null,
  host_token text not null,          -- 방장 브라우저 식별용(로그인 없음)
  team_mode boolean default false,
  team_assign_type text default 'random',  -- 'random' | 'first_come'
  status text default 'waiting',     -- waiting | playing | ended
  current_question_index int default -1,
  reveal boolean default false,      -- 현재 문제 결과 공개 여부
  target_shown_at timestamptz,       -- 반응속도 게임: 시퀀스 시작 시각
  reaction_sequence jsonb,           -- 반응속도 게임: 방해요소 포함 프레임 시퀀스 (마지막 요소=정답)
  created_at timestamptz default now()
);

-- 2. 문제 (questions)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  order_no int not null,
  category text not null,            -- company | proverb | initial | balance | image_vote | reaction
  qtype text not null,               -- mcq | text | vote | reaction
  content text not null,
  options jsonb,                     -- mcq/vote: [{id, label, image_url}] / reaction: {targetShape, targetColor, minDelay, maxDelay, minDecoys, maxDecoys, frameDuration}
  correct_answers jsonb,             -- text: ["정답1","정답2"] / mcq: ["optionId"]
  time_limit int default 20,
  created_at timestamptz default now()
);

-- 3. 참가자 (participants)
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  nickname text not null,
  team text,                         -- 'A' | 'B' | null
  join_order int,
  score int default 0,
  session_token text not null,       -- 참가자 브라우저 식별용(재접속용)
  avatar text,                       -- 젤리 캐릭터 "색번호,소품번호" (예: '3,1')
  joined_at timestamptz default now()
);

-- 4. 답변 (answers)
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  answer_value text,
  is_correct boolean,
  response_time_ms int,
  submitted_at timestamptz default now(),
  unique(question_id, participant_id)
);

-- ============================================
-- Realtime 활성화
-- ============================================
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table questions;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table answers;

-- ============================================
-- RLS: 로그인 없는 MVP라 anon 역할에 넓게 허용
-- (운영 단계에서는 host_token/session_token 검증 정책으로 강화 권장)
-- ============================================
alter table rooms enable row level security;
alter table questions enable row level security;
alter table participants enable row level security;
alter table answers enable row level security;

create policy "anon full access rooms" on rooms for all using (true) with check (true);
create policy "anon full access questions" on questions for all using (true) with check (true);
create policy "anon full access participants" on participants for all using (true) with check (true);
create policy "anon full access answers" on answers for all using (true) with check (true);

-- ============================================
-- 오래된 방 자동 정리 (불특정 다수가 로그인 없이 방을 만드는 구조라
-- 아무도 직접 지우지 않으므로, 생성된 지 24시간 지난 방은 자동 삭제)
-- questions/participants/answers는 rooms에 걸린 ON DELETE CASCADE로 함께 삭제됨
--
-- ⚠️ 먼저 Supabase 대시보드 > Database > Extensions 에서
--    "pg_cron" 확장을 활성화(Enable)한 뒤 아래를 실행하세요.
-- ============================================
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-old-rooms',                 -- job 이름 (중복 실행하면 아래에서 unschedule 후 재등록)
  '0 * * * *',                         -- 매시 정각에 실행
  $$ delete from rooms where created_at < now() - interval '24 hours'; $$
);

-- 참고: 스케줄을 바꾸거나 지우고 싶으면
-- select cron.unschedule('cleanup-old-rooms');
