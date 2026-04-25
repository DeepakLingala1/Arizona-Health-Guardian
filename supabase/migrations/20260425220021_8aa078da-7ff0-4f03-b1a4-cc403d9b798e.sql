
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  age_band TEXT CHECK (age_band IN ('<18','18-34','35-54','55-74','75+')),
  conditions TEXT[] DEFAULT '{}',
  home_county TEXT DEFAULT 'Pima',
  streak INT DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Checkins table
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  county TEXT NOT NULL,
  mood INT CHECK (mood BETWEEN 1 AND 10),
  symptoms TEXT[] DEFAULT '{}',
  recent_travel BOOLEAN DEFAULT false,
  known_exposure BOOLEAN DEFAULT false,
  risk_score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_checkins_county_date ON public.checkins (county, created_at DESC);
CREATE INDEX idx_checkins_user ON public.checkins (user_id, created_at DESC);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins" ON public.checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own checkins" ON public.checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Anonymized aggregate view: allow anyone to read minimal columns via county_daily

-- County daily aggregate
CREATE TABLE public.county_daily (
  county TEXT NOT NULL,
  date DATE NOT NULL,
  checkin_count INT DEFAULT 0,
  top_symptoms JSONB DEFAULT '[]'::jsonb,
  aggregate_risk INT DEFAULT 0,
  weather JSONB,
  air_quality JSONB,
  clusters JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (county, date)
);

ALTER TABLE public.county_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "County data readable by anyone" ON public.county_daily
  FOR SELECT USING (true);

-- AI insights cache
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL, -- 'user' | 'county' | 'simulator' | 'weekly'
  scope_id TEXT NOT NULL,
  insight TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,
  drivers JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_insights_scope ON public.ai_insights (scope, scope_id, generated_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI insights readable by anyone" ON public.ai_insights
  FOR SELECT USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, home_county, age_band)
  VALUES (NEW.id, 'Pima', '35-54')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
