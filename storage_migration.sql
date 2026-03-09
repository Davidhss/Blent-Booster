-- ==========================================================
-- Migração: Bucket de Avatares (Storage)
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ==========================================================

-- 1. Criar o bucket 'avatars' se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa veja os avatares (Público)
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Permitir que usuários autenticados façam upload de seus próprios avatares
CREATE POLICY "Usuários podem subir seus próprios avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars'
);

-- 4. Permitir que usuários atualizem seus próprios avatares
CREATE POLICY "Usuários podem atualizar seus próprios avatares"
ON storage.objects FOR UPDATE
USING (
  auth.uid()::text = (storage.foldername(name))[1] AND
  bucket_id = 'avatars'
);
