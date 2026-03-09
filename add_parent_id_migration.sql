-- ==========================================================
-- Migração: Adicionando Subpastas
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ==========================================================

-- Adicionar a coluna parent_id à tabela idea_folders para permitir pastas aninhadas
ALTER TABLE idea_folders ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES idea_folders(id) ON DELETE CASCADE;
