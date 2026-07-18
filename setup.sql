-- Florence City Public Safety System - Supabase Setup
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

create table if not exists public.cad_calls(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,call_type text,priority text,location text,caller text,units text,status text,narrative text);
create table if not exists public.incidents(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,incident_type text,location text,reporting_person text,involved_people text,status text,narrative text);
create table if not exists public.arrests(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,arrestee text,dob text,charges text,location text,related_record text,disposition text,narrative text,status text default 'SUBMITTED');
create table if not exists public.citations(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,person_name text,plate text,violation text,action text,location text,related_record text,notes text,status text default 'ISSUED');
create table if not exists public.warrants(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,person_name text,dob text,warrant_type text,charges text,status text,notes text);
create table if not exists public.bolos(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,subject text,plate text,description text,reason text,priority text,status text);
create table if not exists public.port_entries(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,time_in timestamptz,time_out timestamptz,name text,company text,visitor_type text,destination text,badge text,plate text,vehicle text,gate text,status text,notes text,exit_gate text,exit_notes text,exit_officer text);
create table if not exists public.port_records(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,record_type text,person_name text,company text,plate text,related_record text,status text,details text);
create table if not exists public.people(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,full_name text,dob text,address text,phone text,license_no text,notes text,status text default 'ACTIVE');
create table if not exists public.vehicles(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,plate text,state text,year text,make text,model text,color text,owner_name text,status text,notes text);
create table if not exists public.evidence(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,unit text,related_record text,item_description text,quantity text,collected_by text,storage_location text,chain_status text,notes text,status text default 'ACTIVE');
create table if not exists public.media_records(id uuid primary key default gen_random_uuid(),record_no text unique not null,created_at timestamptz default now(),updated_at timestamptz default now(),created_by text,related_record text,media_type text,title text,officer text,recorded_at timestamptz,status text,media_url text,description text);
create table if not exists public.activity_log(id uuid primary key default gen_random_uuid(),created_at timestamptz default now(),officer text,unit text,action text,module text,record_no text,details text);
create table if not exists public.watch_list(id uuid primary key default gen_random_uuid(),record_no text unique not null default ('WL-'||substr(gen_random_uuid()::text,1,8)),created_at timestamptz default now(),name text,badge text,plate text,company text,reason text,required_action text default 'CONTACT SUPERVISOR',status text default 'ACTIVE');


-- Multi-department upgrade (safe to run on an existing installation)
do $$
declare t text;
begin
 foreach t in array array['cad_calls','incidents','arrests','citations','warrants','bolos','port_entries','port_records','people','vehicles','evidence','media_records','activity_log','watch_list']
 loop
  execute format('alter table public.%I add column if not exists department text default ''FCPD''', t);
 end loop;
end $$;
alter table public.arrests add column if not exists classification text default 'OTHER';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('bodycam','bodycam',true,52428800,array['video/mp4','video/webm','image/jpeg','image/png','audio/mpeg','audio/wav'])
on conflict(id) do update set public=true;

do $$ declare t text; begin
 foreach t in array array['cad_calls','incidents','arrests','citations','warrants','bolos','port_entries','port_records','people','vehicles','evidence','media_records','activity_log','watch_list']
 loop execute format('alter table public.%I enable row level security',t);
 execute format('drop policy if exists "game access" on public.%I',t);
 execute format('create policy "game access" on public.%I for all to anon using (true) with check (true)',t);
 execute format('grant select,insert,update,delete on public.%I to anon',t);
 begin execute format('alter publication supabase_realtime add table public.%I',t); exception when duplicate_object then null; end;
 end loop;
end $$;

drop policy if exists "game bodycam upload" on storage.objects;
create policy "game bodycam upload" on storage.objects for insert to anon with check (bucket_id='bodycam');
drop policy if exists "game bodycam read" on storage.objects;
create policy "game bodycam read" on storage.objects for select to anon using (bucket_id='bodycam');

-- This setup is intentionally open for a private game website.
-- Do not store real confidential or personal information.

-- Version 3 foundation upgrade
create table if not exists public.companies(
 id uuid primary key default gen_random_uuid(), record_no text unique not null,
 created_at timestamptz default now(), updated_at timestamptz default now(),
 created_by text, unit text, department text default 'FCHP', company_name text,
 company_type text, contact_name text, phone text, address text, access_level text,
 status text default 'ACTIVE', notes text
);
create table if not exists public.shifts(
 id uuid primary key default gen_random_uuid(), record_no text unique not null,
 created_at timestamptz default now(), updated_at timestamptz default now(),
 created_by text, unit text, department text default 'FCPD', officer_name text,
 unit_number text, rank text, division text, assignment text, status text default 'AVAILABLE',
 vehicle text, shift_start timestamptz, shift_end timestamptz, notes text
);

do $$ declare t text; begin
 foreach t in array array['cad_calls','incidents','arrests','citations','warrants','bolos','port_entries','port_records','people','vehicles','evidence','media_records','companies','shifts']
 loop
  execute format('alter table public.%I add column if not exists review_notes text',t);
  execute format('alter table public.%I add column if not exists locked boolean default false',t);
 end loop;
end $$;

do $$ declare t text; begin
 foreach t in array array['companies','shifts']
 loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists "game access" on public.%I',t);
  execute format('create policy "game access" on public.%I for all to anon using (true) with check (true)',t);
  execute format('grant select,insert,update,delete on public.%I to anon',t);
  begin execute format('alter publication supabase_realtime add table public.%I',t); exception when duplicate_object then null; end;
 end loop;
end $$;

NOTIFY pgrst, 'reload schema';


-- Version 4 officer-centric patrol upgrade
create table if not exists public.patrol_status(
 id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(),
 officer_name text not null, unit_number text, department text default 'FCPD', status text default 'AVAILABLE',
 status_since timestamptz default now(), location text, last_action text
);
create table if not exists public.shared_notes(
 id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), officer_name text,
 unit_number text, department text default 'FCPD', note text not null, pinned boolean default false
);
create table if not exists public.officer_messages(
 id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), officer_name text,
 unit_number text, department text default 'FCPD', message text not null
);
create table if not exists public.form_templates(
 id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), form_name text not null,
 department text default 'ALL', fields jsonb default '[]'::jsonb, created_by text, active boolean default true
);
do $$ declare t text; begin
 foreach t in array array['patrol_status','shared_notes','officer_messages','form_templates'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists "game access" on public.%I',t);
  execute format('create policy "game access" on public.%I for all to anon using (true) with check (true)',t);
  execute format('grant select,insert,update,delete on public.%I to anon',t);
  begin execute format('alter publication supabase_realtime add table public.%I',t); exception when duplicate_object then null; end;
 end loop;
end $$;
NOTIFY pgrst, 'reload schema';


-- VERSION 5 PATROL TOOLKIT AND INTELLIGENCE MODULES
create table if not exists traffic_stops (id uuid primary key default gen_random_uuid(), record_no text unique, department text, location text, driver_name text, driver_dob date, passengers text, plate text, vehicle text, insurance_status text, registration_status text, reason text, search_basis text, outcome text, related_record text, narrative text, created_by text, created_at timestamptz default now());
create table if not exists field_interviews (id uuid primary key default gen_random_uuid(), record_no text unique, department text, person_name text, dob date, location text, reason text, associates text, vehicle_plate text, description text, notes text, created_by text, created_at timestamptz default now());
create table if not exists vehicle_searches (id uuid primary key default gen_random_uuid(), record_no text unique, department text, driver_name text, plate text, vehicle text, location text, legal_basis text, consent_given text, areas_searched text, contraband_found text, evidence_record text, related_record text, notes text, created_by text, created_at timestamptz default now());
create table if not exists tow_records (id uuid primary key default gen_random_uuid(), record_no text unique, department text, plate text, vehicle text, owner_name text, tow_company text, impound_lot text, reason text, inventory text, status text, release_to text, related_record text, created_by text, created_at timestamptz default now());
create table if not exists visitor_passes (id uuid primary key default gen_random_uuid(), record_no text unique, department text, visitor_name text, company text, badge_number text, vehicle_plate text, destination text, escort_required text, valid_from timestamptz, expires_at timestamptz, status text, notes text, created_by text, created_at timestamptz default now());
create table if not exists access_list (id uuid primary key default gen_random_uuid(), record_no text unique, department text, subject_type text, subject_name text, plate text, access_status text, reason text, effective_date date, expiration_date date, authorized_by text, notes text, created_by text, created_at timestamptz default now());
create table if not exists court_events (id uuid primary key default gen_random_uuid(), record_no text unique, department text, related_record text, event_type text, court_name text, judge text, prosecutor text, event_at timestamptz, location text, disposition text, notes text, created_by text, created_at timestamptz default now());
create table if not exists equipment_checkout (id uuid primary key default gen_random_uuid(), record_no text unique, department text, item_type text, asset_number text, serial_number text, assigned_to text, checkout_at timestamptz, return_at timestamptz, condition_out text, condition_in text, status text, notes text, created_by text, created_at timestamptz default now());
create table if not exists notifications (id uuid primary key default gen_random_uuid(), department text, title text not null, message text, type text default 'INFO', is_read boolean default false, created_by text, created_at timestamptz default now());

alter table traffic_stops enable row level security; alter table field_interviews enable row level security; alter table vehicle_searches enable row level security; alter table tow_records enable row level security; alter table visitor_passes enable row level security; alter table access_list enable row level security; alter table court_events enable row level security; alter table equipment_checkout enable row level security; alter table notifications enable row level security;
do $$ declare t text; begin foreach t in array array['traffic_stops','field_interviews','vehicle_searches','tow_records','visitor_passes','access_list','court_events','equipment_checkout','notifications'] loop execute format('drop policy if exists "public all" on %I',t); execute format('create policy "public all" on %I for all using (true) with check (true)',t); end loop; end $$;
select pg_notify('pgrst','reload schema');

-- VERSION 6: COMPLETE REALTIME SYNCHRONIZATION
-- Run this block once in Supabase SQL Editor. It is safe to run again.
do $$
declare
  t text;
  realtime_tables text[] := array[
    'cad_calls','incidents','arrests','citations','warrants','bolos',
    'port_entries','port_records','people','vehicles','evidence','media_records',
    'companies','shifts','activity_log','watch_list','patrol_status','shared_notes',
    'officer_messages','form_templates','traffic_stops','field_interviews',
    'vehicle_searches','tow_records','visitor_passes','access_list','court_events',
    'equipment_checkout','notifications'
  ];
begin
  foreach t in array realtime_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('grant select, insert, update, delete on table public.%I to anon', t);
      execute format('drop policy if exists "game access" on public.%I', t);
      execute format('drop policy if exists "public all" on public.%I', t);
      execute format('create policy "game access" on public.%I for all to anon using (true) with check (true)', t);
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end if;
  end loop;
end $$;

NOTIFY pgrst, 'reload schema';

-- VERSION 6.2: SCHEMA RECONCILIATION / RELIABILITY FIX
-- Safe to run on both new and existing FPSS databases.
-- This block fixes columns that older setup files may not have created.
do $$
declare
  t text;
  unit_tables text[] := array[
    'traffic_stops','field_interviews','vehicle_searches','tow_records',
    'visitor_passes','access_list','court_events','equipment_checkout'
  ];
  timestamp_tables text[] := array[
    'traffic_stops','field_interviews','vehicle_searches','tow_records',
    'visitor_passes','access_list','court_events','equipment_checkout','notifications'
  ];
begin
  foreach t in array unit_tables loop
    if to_regclass(format('public.%I',t)) is not null then
      execute format('alter table public.%I add column if not exists unit text',t);
    end if;
  end loop;

  -- Media is created by its own form today, but adding unit keeps the schema
  -- compatible with shared record helpers and future updates.
  if to_regclass('public.media_records') is not null then
    alter table public.media_records add column if not exists unit text;
  end if;

  foreach t in array timestamp_tables loop
    if to_regclass(format('public.%I',t)) is not null then
      execute format('alter table public.%I add column if not exists updated_at timestamptz default now()',t);
    end if;
  end loop;
end $$;

-- Keep updated_at current on all records that have that column.
do $$
declare
  t text;
  tracked_tables text[] := array[
    'cad_calls','incidents','arrests','citations','warrants','bolos','port_entries',
    'port_records','people','vehicles','evidence','media_records','companies','shifts',
    'patrol_status','traffic_stops','field_interviews','vehicle_searches','tow_records',
    'visitor_passes','access_list','court_events','equipment_checkout','notifications'
  ];
begin
  foreach t in array tracked_tables loop
    if to_regclass(format('public.%I',t)) is not null then
      execute format('drop trigger if exists set_updated_at on public.%I',t);
      execute format('create trigger set_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t);
    end if;
  end loop;
end $$;

-- Re-apply access and realtime publication after reconciliation.
do $$
declare
  t text;
  all_tables text[] := array[
    'cad_calls','incidents','arrests','citations','warrants','bolos','port_entries',
    'port_records','people','vehicles','evidence','media_records','companies','shifts',
    'activity_log','watch_list','patrol_status','shared_notes','officer_messages',
    'form_templates','traffic_stops','field_interviews','vehicle_searches','tow_records',
    'visitor_passes','access_list','court_events','equipment_checkout','notifications'
  ];
begin
  foreach t in array all_tables loop
    if to_regclass(format('public.%I',t)) is not null then
      execute format('alter table public.%I enable row level security',t);
      execute format('grant select, insert, update, delete on public.%I to anon',t);
      execute format('drop policy if exists "game access" on public.%I',t);
      execute format('drop policy if exists "public all" on public.%I',t);
      execute format('create policy "game access" on public.%I for all to anon using (true) with check (true)',t);
      if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=t
      ) then
        execute format('alter publication supabase_realtime add table public.%I',t);
      end if;
    end if;
  end loop;
end $$;

NOTIFY pgrst, 'reload schema';

-- Optional verification result: every row should say true/zero after setup.
select
  to_regclass('public.access_list') is not null as access_list_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='access_list' and column_name='unit') as access_list_has_unit,
  (select count(*) from unnest(array[
    'cad_calls','incidents','arrests','citations','warrants','bolos','port_entries',
    'port_records','people','vehicles','evidence','media_records','companies','shifts',
    'activity_log','watch_list','patrol_status','shared_notes','officer_messages',
    'form_templates','traffic_stops','field_interviews','vehicle_searches','tow_records',
    'visitor_passes','access_list','court_events','equipment_checkout','notifications'
  ]) x(table_name)
  where not exists (
    select 1 from pg_publication_tables p
    where p.pubname='supabase_realtime' and p.schemaname='public' and p.tablename=x.table_name
  )) as tables_missing_from_realtime;

-- VERSION 6.5: HARDEN REALTIME UPDATE/DELETE PAYLOADS
-- Ensures update and delete events include enough row data for every connected browser.
do $$
declare t text;
begin
  foreach t in array array[
    'cad_calls','incidents','arrests','citations','warrants','bolos','port_entries',
    'port_records','people','vehicles','evidence','media_records','companies','shifts',
    'activity_log','watch_list','patrol_status','shared_notes','officer_messages',
    'form_templates','traffic_stops','field_interviews','vehicle_searches','tow_records',
    'visitor_passes','access_list','court_events','equipment_checkout','notifications'
  ] loop
    if to_regclass(format('public.%I',t)) is not null then
      execute format('alter table public.%I replica identity full',t);
    end if;
  end loop;
end $$;
NOTIFY pgrst, 'reload schema';

-- VERSION 6.7: SUBJECT ALERTS + FIRST/LAST NAME MATCHING
-- Safe to run on an existing installation.
create table if not exists public.subject_alerts(
 id uuid primary key default gen_random_uuid(),
 record_no text unique not null,
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 created_by text,
 unit text,
 department text default 'FCPD',
 first_name text,
 middle_name text,
 last_name text,
 dob date,
 plate text,
 alert_type text default 'OFFICER SAFETY',
 severity text default 'HIGH',
 status text default 'ACTIVE',
 details text
);

do $$
declare t text;
begin
 foreach t in array array['people','arrests','citations','warrants','traffic_stops','field_interviews','vehicle_searches','visitor_passes','port_entries'] loop
  if to_regclass(format('public.%I',t)) is not null then
   execute format('alter table public.%I add column if not exists first_name text',t);
   execute format('alter table public.%I add column if not exists last_name text',t);
  end if;
 end loop;
 alter table public.people add column if not exists middle_name text;
end $$;

alter table public.subject_alerts enable row level security;
drop policy if exists "game access" on public.subject_alerts;
create policy "game access" on public.subject_alerts for all to anon using (true) with check (true);
grant select,insert,update,delete on public.subject_alerts to anon;
alter table public.subject_alerts replica identity full;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='subject_alerts') then
  alter publication supabase_realtime add table public.subject_alerts;
 end if;
end $$;
drop trigger if exists set_updated_at on public.subject_alerts;
create trigger set_updated_at before update on public.subject_alerts for each row execute function public.touch_updated_at();
NOTIFY pgrst, 'reload schema';


-- VERSION 6.8: GUIDED PORT GATE SCREENING
-- Safe to run on an existing database. Existing gate records are preserved.
alter table public.port_entries add column if not exists first_name text;
alter table public.port_entries add column if not exists last_name text;
alter table public.port_entries add column if not exists dob date;
alter table public.port_entries add column if not exists purpose_of_visit text;
alter table public.port_entries add column if not exists contact_person text;
alter table public.port_entries add column if not exists prior_visit text;
alter table public.port_entries add column if not exists id_type text;
alter table public.port_entries add column if not exists id_number text;
alter table public.port_entries add column if not exists id_state text;
alter table public.port_entries add column if not exists id_status text;
alter table public.port_entries add column if not exists twic_status text;
alter table public.port_entries add column if not exists twic_number text;
alter table public.port_entries add column if not exists port_badge_status text;
alter table public.port_entries add column if not exists plate_state text;
alter table public.port_entries add column if not exists vehicle_year text;
alter table public.port_entries add column if not exists vehicle_make text;
alter table public.port_entries add column if not exists vehicle_model text;
alter table public.port_entries add column if not exists vehicle_color text;
alter table public.port_entries add column if not exists vehicle_type text;
alter table public.port_entries add column if not exists vehicle_ownership text;
alter table public.port_entries add column if not exists has_trailer text;
alter table public.port_entries add column if not exists trailer_number text;
alter table public.port_entries add column if not exists occupants text;
alter table public.port_entries add column if not exists carrier_company text;
alter table public.port_entries add column if not exists usdot_number text;
alter table public.port_entries add column if not exists cargo_type text;
alter table public.port_entries add column if not exists cargo_description text;
alter table public.port_entries add column if not exists dock_destination text;
alter table public.port_entries add column if not exists shipping_paperwork text;
alter table public.port_entries add column if not exists trailer_sealed text;
alter table public.port_entries add column if not exists seal_number text;
alter table public.port_entries add column if not exists hazmat text;
alter table public.port_entries add column if not exists hazmat_class text;
alter table public.port_entries add column if not exists authorized_by text;
alter table public.port_entries add column if not exists appointment_reference text;
alter table public.port_entries add column if not exists work_area text;
alter table public.port_entries add column if not exists expected_departure timestamptz;
alter table public.port_entries add column if not exists onsite_supervisor text;
alter table public.port_entries add column if not exists supervisor_contact text;
alter table public.port_entries add column if not exists equipment_tools text;
alter table public.port_entries add column if not exists escort_required text;
alter table public.port_entries add column if not exists visitor_pass_issued text;
alter table public.port_entries add column if not exists weapons_declared text;
alter table public.port_entries add column if not exists weapons_description text;
alter table public.port_entries add column if not exists dangerous_materials text;
alter table public.port_entries add column if not exists dangerous_materials_description text;
alter table public.port_entries add column if not exists prohibited_items text;
alter table public.port_entries add column if not exists prohibited_items_explanation text;
alter table public.port_entries add column if not exists inspection_compliance text;
alter table public.port_entries add column if not exists search_decision text;
alter table public.port_entries add column if not exists refusal_acknowledged text;
alter table public.port_entries add column if not exists vehicle_search_record text;
alter table public.port_entries add column if not exists checklist_comments text;
alter table public.port_entries add column if not exists final_escort_required text;
alter table public.port_entries add column if not exists supervisor_notified text;
alter table public.port_entries add column if not exists denial_reason text;
alter table public.port_entries add column if not exists screening_data jsonb default '{}'::jsonb;
alter table public.port_entries add column if not exists alert_match_count integer default 0;
alter table public.port_entries add column if not exists alert_check_at timestamptz;
alter table public.port_entries add column if not exists business_completed text;
alter table public.port_entries add column if not exists unusual_occurred text;
alter table public.port_entries add column if not exists cargo_verified text;
alter table public.port_entries add column if not exists exit_seal_intact text;
NOTIFY pgrst, 'reload schema';
