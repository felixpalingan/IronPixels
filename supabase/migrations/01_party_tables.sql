CREATE TABLE IF NOT EXISTS public."Party" (
    party_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_name TEXT NOT NULL,
    leader_id UUID NOT NULL,
    total_party_floor INT DEFAULT 1,
    total_party_cp INT DEFAULT 0,
    total_party_rvs INT DEFAULT 0,
    party_streak INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Party_Members" (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES public."Party"(party_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(party_id, user_id)
);

ALTER TABLE public."Party" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Party_Members" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Party public access" ON public."Party";
CREATE POLICY "Party public access" ON public."Party" FOR ALL USING (true);

DROP POLICY IF EXISTS "Party_Members public access" ON public."Party_Members";
CREATE POLICY "Party_Members public access" ON public."Party_Members" FOR ALL USING (true);
