-- ==========================================================
-- Migração: Suporte a Pastas Aninhadas no Banco de Ideias
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ==========================================================

-- Adicionar coluna parent_id para suportar pastas dentro de pastas
ALTER TABLE idea_folders ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES idea_folders(id) ON DELETE CASCADE;
