-- Drop existing Spark AZ predecessor tables
DROP TABLE IF EXISTS public.ai_insights CASCADE;
DROP TABLE IF EXISTS public.checkins CASCADE;
DROP TABLE IF EXISTS public.county_daily CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =====================================================
-- profiles
-- =====================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  persona text NOT NULL DEFAULT 'urban' CHECK (persona IN ('rancher','tribal','student','parent','border','urban','outdoor','senior','analyst')),
  age_band text CHECK (age_band IN ('<18','18-34','35-54','55-74','75+')),
  conditions text[] NOT NULL DEFAULT '{}',
  home_county text NOT NULL DEFAULT 'Pima',
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','es')),
  role text NOT NULL DEFAULT 'public' CHECK (role IN ('public','analyst')),
  streak int NOT NULL DEFAULT 0,
  last_checkin_date date,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- has_role helper (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_uid uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = _role);
$$;

-- =====================================================
-- checkins
-- =====================================================
CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  county text NOT NULL,
  category text NOT NULL CHECK (category IN ('self','animal','environment')),
  -- self
  mood int,
  symptoms text[] NOT NULL DEFAULT '{}',
  recent_travel boolean DEFAULT false,
  travel_destination text,
  known_exposure boolean DEFAULT false,
  -- animal
  animal_type text,
  animal_signs text[] NOT NULL DEFAULT '{}',
  animal_count int,
  -- environment
  env_signals text[] NOT NULL DEFAULT '{}',
  notes text,
  risk_score int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX checkins_county_idx ON public.checkins (county, created_at DESC);
CREATE INDEX checkins_category_idx ON public.checkins (category, created_at DESC);
CREATE INDEX checkins_user_idx ON public.checkins (user_id, created_at DESC);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own checkins" ON public.checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkins" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- county_daily
-- =====================================================
CREATE TABLE public.county_daily (
  county text NOT NULL,
  date date NOT NULL,
  checkin_count int NOT NULL DEFAULT 0,
  human_score int NOT NULL DEFAULT 0,
  animal_score int NOT NULL DEFAULT 0,
  vector_score int NOT NULL DEFAULT 0,
  env_score int NOT NULL DEFAULT 0,
  composite_risk int NOT NULL DEFAULT 0,
  top_human_symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_animal_signs jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_env_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  weather jsonb,
  air_quality jsonb,
  clusters jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (county, date)
);
ALTER TABLE public.county_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "County data public read" ON public.county_daily FOR SELECT USING (true);

-- =====================================================
-- ai_insights
-- =====================================================
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('user','county','simulator','digest')),
  scope_id text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  insight text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  drivers jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_insights_scope_idx ON public.ai_insights (scope, scope_id, language, generated_at DESC);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI insights public read" ON public.ai_insights FOR SELECT USING (true);

-- =====================================================
-- alerts (HITL)
-- =====================================================
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low','moderate','elevated','high')),
  title text NOT NULL,
  body text NOT NULL,
  ai_generated boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','edited','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alerts_status_idx ON public.alerts (status, created_at DESC);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved alerts public read" ON public.alerts
  FOR SELECT USING (status = 'approved' OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Analysts update alerts" ON public.alerts
  FOR UPDATE USING (public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Analysts insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'analyst'));

-- =====================================================
-- review_log
-- =====================================================
CREATE TABLE public.review_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE,
  actor uuid,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analysts read review log" ON public.review_log
  FOR SELECT USING (public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Analysts write review log" ON public.review_log
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'analyst'));

-- =====================================================
-- epicore_feed
-- =====================================================
CREATE TABLE public.epicore_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  hazard text NOT NULL,
  summary text NOT NULL,
  severity int NOT NULL DEFAULT 1,
  pathway text CHECK (pathway IN ('travel','vector','animal','environment')),
  observed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.epicore_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Epicore public read" ON public.epicore_feed FOR SELECT USING (true);

-- =====================================================
-- Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, persona, home_county, language, role)
  VALUES (NEW.id, 'urban', 'Pima', 'en', 'public')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();