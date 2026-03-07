import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

export const publishToInstagram = async (postId: string, userId: string, imageUrl: string, caption: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sessão expirada. Autentique-se novamente.');

        const response = await fetch(`${API_URL}/api/instagram/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                postId,
                imageUrl,
                caption
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao publicar no Instagram');
        }

        return { success: true, ig_media_id: data.ig_media_id };
    } catch (error: any) {
        console.error('Instagram Publish Error:', error);
        throw error;
    }
};

/**
 * Verifica se o usuário tem uma conta do Instagram conectada
 */
export const checkInstagramConnection = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_social_accounts')
        .select('platform_user_id')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .single();

    if (error || !data) return false;
    return true;
};
