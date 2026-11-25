begin;
create schema if not exists legacy_private;
revoke all on schema legacy_private from public, anon, authenticated;
create table public.enquiries (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 fingerprint text not null,
 created_at timestamptz not null default now(),
 full_name text not null, email text not null, country_code text not null, phone text not null,
 organisation text not null, stakeholder_type text not null check (stakeholder_type in ('owner','acquirer','investor','operator','scout','general')),
 industry text, geography text[], transaction_interests text[], transaction_type text,
 financial_range text, experience text, professional_background text,
 additional_information text, linkedin text, enquiry_message text,
 source_page text not null, source_cta text not null, referral text,
 consent boolean not null check (consent), consent_version text not null, consent_at timestamptz not null default now(),
 status text not null default 'New' check (status in ('New','Contacted','Qualified','In Discussion','Active','Closed','Archived')),
 follow_up_date date, assigned_team_member text, internal_remarks text
);
create index enquiries_pipeline on public.enquiries(status,follow_up_date);
create index enquiries_fingerprint on public.enquiries(fingerprint,created_at desc);
alter table public.enquiries enable row level security;
revoke all on table public.enquiries from public, anon, authenticated, service_role;
create table legacy_private.submission_limits (
 bucket text primary key, since timestamptz not null, hits integer not null
);
create index submission_limits_expiry on legacy_private.submission_limits(since);
create function legacy_private.items(v jsonb) returns text[] language sql immutable as $$
 select case jsonb_typeof(v) when 'array' then array(select jsonb_array_elements_text(v))
 when 'string' then array[v #>> '{}'] else array[]::text[] end
$$;
create function public.accept_enquiry(p_request uuid,p_fingerprint text,p_network text,p_email text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
 existing public.enquiries%rowtype;
 a jsonb := p_data->'answers';
 new_id uuid;
 bucket_key text;
 count_now integer;
begin
 -- Serialize retries and equal submissions across workers. Locks last one transaction.
 perform pg_advisory_xact_lock(hashtextextended('request:' || p_request::text,0));
 perform pg_advisory_xact_lock(hashtextextended('payload:' || p_fingerprint,0));
 select * into existing from public.enquiries where request_id=p_request;
 if found then
   if existing.fingerprint <> p_fingerprint then return jsonb_build_object('state','conflict'); end if;
   return jsonb_build_object('state','duplicate','reference',existing.id);
 end if;
 select * into existing from public.enquiries where fingerprint=p_fingerprint and created_at>now()-interval '15 minutes' order by created_at desc limit 1;
 if found then return jsonb_build_object('state','duplicate','reference',existing.id); end if;
 delete from legacy_private.submission_limits where since < now()-interval '2 hours';
 foreach bucket_key in array array['network:'||p_network,'email:'||p_email] loop
  insert into legacy_private.submission_limits as l(bucket,since,hits) values (bucket_key,now(),1)
  on conflict(bucket) do update set
    hits=case when l.since<=now()-interval '1 hour' then 1 else least(l.hits+1,100) end,
    since=case when l.since<=now()-interval '1 hour' then now() else l.since end
  returning hits into count_now;
  if count_now > (case when bucket_key=('network:'||p_network) then 20 else 4 end) then
    return jsonb_build_object('state','limited');
  end if;
 end loop;
 insert into public.enquiries(request_id,fingerprint,full_name,email,country_code,phone,organisation,
 stakeholder_type,industry,geography,transaction_interests,transaction_type,financial_range,experience,professional_background,
 additional_information,linkedin,enquiry_message,source_page,source_cta,referral,consent,consent_version)
 values(p_request,p_fingerprint,p_data->>'name',p_data->>'email',p_data->>'country',p_data->>'phone',p_data->>'company',
 p_data->>'role',nullif(p_data->>'sector',''),legacy_private.items(a->'geography'),legacy_private.items(a->'interest'),nullif(p_data->>'transaction',''),
 a->>'range',a->>'experience',a->>'background',nullif(p_data->>'context',''),nullif(p_data->>'linkedin',''),a->>'message',
 p_data->>'sourcePage',p_data->>'sourceCTA',nullif(p_data->>'referral',''),true,p_data->>'consentVersion')
 returning id into new_id;
 return jsonb_build_object('state','stored','reference',new_id);
end;
$$;
revoke all on function public.accept_enquiry(uuid,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.accept_enquiry(uuid,text,text,text,jsonb) to service_role;
commit;
