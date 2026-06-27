-- ============================================
-- Schema do Supabase para o app Sara&Eu
-- Execute este SQL no "SQL Editor" do Supabase
-- ============================================

-- Tabela de casais
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários do casal
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin TEXT,
  role TEXT CHECK (role IN ('her', 'him')) NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Humor diário
CREATE TABLE daily_mood (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  moods JSONB NOT NULL DEFAULT '{}',
  date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Cartas do correio do amor
CREATE TABLE letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  has_reaction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reference_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Habilitar Realtime nas tabelas necessárias
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE daily_mood;
ALTER PUBLICATION supabase_realtime ADD TABLE letters;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================
-- Row Level Security (RLS) — Política aberta
-- Para um app de casal simples, vamos liberar
-- acesso pela anon key com políticas permissivas.
-- ============================================
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mood ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total via anon key)
CREATE POLICY "Allow all on couples" ON couples FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_mood" ON daily_mood FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on letters" ON letters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Inserir dados iniciais do casal
-- ============================================
INSERT INTO couples (id) VALUES ('00000000-0000-0000-0000-000000000001');

INSERT INTO users (couple_id, name, pin, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sara', NULL, 'her'),
  ('00000000-0000-0000-0000-000000000001', 'Arthur', NULL, 'him');
