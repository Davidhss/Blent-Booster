import { serve } from "https://deno.land/std@0.177.1/http/server.ts"
import Stripe from "npm:stripe@^14.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Ensure correct Stripe API version
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16', // Fallback, Deno requires concrete versions or latest compatible
    httpClient: Stripe.createFetchHttpClient(), // Important for Deno/Edge environments
})

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// TOKEN ALLOCATIONS
const PLAN_TOKENS: Record<string, number> = {
    monthly: 1000,
    quarterly: 3500,
    annual: 15000,
}

const PACK_TOKENS: Record<string, number> = {
    starter: 500,
    boost: 2000,
    pro: 5000,
}

// EMAIL SENDER HELPER
const sendEmailViaSendGrid = async (toEmail: string, subject: string, htmlContent: string) => {
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || ""
    if (!SENDGRID_API_KEY) {
        console.error("SENDGRID_API_KEY is not defined. No email sent.")
        return
    }

    try {
        const sendgridRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: toEmail }], subject: subject }],
                from: { email: "contato@assessoriablent.com", name: "BlentBoost" },
                content: [{ type: "text/html", value: htmlContent }]
            })
        })

        if (!sendgridRes.ok) {
            const sendgridErr = await sendgridRes.text()
            console.error("Erro ao enviar e-mail via SendGrid:", sendgridErr)
        } else {
            console.log(`Email '${subject}' enviado para ${toEmail} com sucesso!`)
        }
    } catch (e: any) {
        console.error("Erro fatal ao enviar email:", e)
    }
}

console.log(`Stripe Webhook Edge Function Started!`)

serve(async (req) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const sig = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

    if (!sig || !webhookSecret) {
        return new Response(JSON.stringify({ error: 'Missing signature or secret' }), { status: 400 })
    }

    let event;
    try {
        // Read the raw body as text for Stripe signature verification
        const body = await req.text()

        event = await stripe.webhooks.constructEventAsync(
            body,
            sig,
            webhookSecret
        )
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                let userId = session.client_reference_id;
                const purchaseType = session.metadata?.purchase_type || 'subscription';

                let generatedPassword = null;
                let isNewUser = false;
                let userEmail = session.customer_details?.email || session.customer_email || undefined;
                let userName = session.customer_details?.name || 'Booster';

                if (!userId && userEmail) {
                    try {
                        const { data: existingProfile } = await supabaseAdmin
                            .from('profiles')
                            .select('id')
                            .eq('email', userEmail)
                            .single();

                        if (existingProfile) {
                            userId = existingProfile.id;
                        } else {
                            generatedPassword = "Bb" + Math.floor(1000 + Math.random() * 9000) + Math.random().toString(36).slice(-4) + "!";
                            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                                email: userEmail,
                                password: generatedPassword,
                                email_confirm: true,
                                user_metadata: { name: userName }
                            });

                            if (createError) {
                                console.error("Erro ao auto-criar conta via webhook:", createError);
                            } else if (newUser.user) {
                                userId = newUser.user.id;
                                isNewUser = true;
                                await supabaseAdmin.from('profiles').upsert({
                                    id: userId,
                                    email: userEmail,
                                    name: userName
                                }, { onConflict: 'id' });
                            }
                        }
                    } catch (e) {
                        console.error("Erro consultando perfis no webhook:", e);
                    }
                }

                if (!userId) {
                    console.warn("Webhook aborted: No userId could be resolved or created for session.");
                    break;
                }

                if (purchaseType === 'subscription') {
                    const planType = session.metadata?.plan_type || 'monthly';
                    const tokens = PLAN_TOKENS[planType] || 1000;

                    let subscriptionEndDate: string | null = null;
                    let stripeSubscriptionId: string | null = session.subscription as string | null;
                    if (stripeSubscriptionId) {
                        try {
                            const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
                            subscriptionEndDate = new Date(stripeSubscription.current_period_end * 1000).toISOString();
                        } catch (e) {
                            console.error('Failed to retrieve subscription from Stripe:', e);
                        }
                    }

                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_status: 'active',
                            subscription_plan: planType,
                            token_balance: tokens,
                            last_payment_date: new Date().toISOString(),
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: stripeSubscriptionId,
                            subscription_end_date: subscriptionEndDate,
                        })
                        .eq('id', userId);

                    if (error) {
                        console.error('Supabase update error (subscription):', error);
                    } else {
                        await supabaseAdmin.from('token_transactions').insert({
                            user_id: userId,
                            amount: tokens,
                            type: 'subscription_grant',
                            description: `Plano ${planType}   ${tokens} tokens concedidos`,
                        });
                        console.log(`  Subscription activated for user ${userId}. Plan: ${planType}. Tokens set to: ${tokens}`);

                        try {
                            // Fetch user email specifically from profiles if we don't have it locally
                            let finalUserEmail = userEmail;
                            if (!finalUserEmail) {
                                const { data: pData } = await supabaseAdmin.from('profiles').select('email').eq('id', userId).single();
                                if (pData && pData.email) finalUserEmail = pData.email;
                            }

                            if (finalUserEmail) {
                                const welcomeHtml = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao BlentBoost</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #06060f; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #06060f;">
          <tr>
              <td align="center" style="padding: 40px 0;">
                  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #14141e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden;">
                      <tr>
                          <td style="padding: 40px 40px 20px 40px; text-align: center;">
                              <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7e22ce); padding: 14px 16px; border-radius: 16px; margin-bottom: 24px;">
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                                  </svg>
                              </div>
                              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Você agora é um Booster! 🚀</h1>
                          </td>
                      </tr>
                      
                      <tr>
                          <td style="padding: 20px 40px 40px 40px;">
                              <p style="margin: 0 0 24px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                  Olá! Seu pagamento do plano <strong style="color: #ffffff; text-transform: uppercase;">${planType}</strong> foi confirmado! A sua conta já foi atualizada e liberada com sucesso.
                              </p>
                              
                              ${isNewUser && generatedPassword ? `
                              <div style="background-color: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                                  <h3 style="margin: 0 0 16px 0; color: #a78bfa; font-size: 18px;">🔐 Suas Credenciais de Acesso</h3>
                                  <p style="margin: 0 0 12px 0; color: rgba(255, 255, 255, 0.8);">Uma conta foi criada automaticamente para você. Use os dados abaixo para entrar:</p>
                                  <p style="margin: 0 0 8px 0; color: #ffffff;"><strong>E-mail:</strong> ${finalUserEmail}</p>
                                  <p style="margin: 0 0 0 0; color: #ffffff;"><strong>Senha:</strong> ${generatedPassword}</p>
                                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.5); font-size: 12px;">Recomendamos alterar sua senha após o primeiro acesso.</p>
                              </div>
                              ` : ''}
  
                              <p style="margin: 0 0 32px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                  Prepare-se para criar conteúdos magnéticos e dominar o algoritmo. Aqui estão os seus próximos passos para extrair o máximo do BlentBoost:
                              </p>
  
                              <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                                  <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px;">🛠️ Primeiros Passos:</h3>
                                  <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.7); line-height: 1.6;">
                                      <li style="margin-bottom: 12px;">Acesse a plataforma com seus dados de login.</li>
                                      <li style="margin-bottom: 12px;">Preencha seu perfil para que a IA entenda seu tom de voz e estilo.</li>
                                      <li>Gere seu primeiro post viral em segundos!</li>
                                  </ul>
                              </div>
                              
                              <div style="text-align: center;">
                                  <a href="https://app.assessoriablent.com" style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #7e22ce); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);">
                                      ACESSAR O BLENTBOOST
                                  </a>
                              </div>
                          </td>
                      </tr>
                      
                      <tr>
                          <td style="padding: 24px 40px; background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                              <p style="margin: 0; color: rgba(255, 255, 255, 0.3); font-size: 12px;">
                                  &copy; 2026 BlentBoost. Todos os direitos reservados.
                              </p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>`;
                                await sendEmailViaSendGrid(finalUserEmail, "Bem-vindo(a) ao BlentBoost! 🎉", welcomeHtml);
                            }
                        } catch (e) {
                            console.error("Failed to send welcome email:", e);
                        }
                    }
                } else if (purchaseType === 'token_pack') {
                    const packType = session.metadata?.pack_type || 'starter';
                    const tokens = PACK_TOKENS[packType] || 500;

                    const { data: profileData } = await supabaseAdmin
                        .from('profiles')
                        .select('token_balance')
                        .eq('id', userId)
                        .single();

                    const currentBalance = profileData?.token_balance || 0;
                    const newBalance = currentBalance + tokens;

                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .update({ token_balance: newBalance })
                        .eq('id', userId);

                    if (error) {
                        console.error('Supabase update error (token pack):', error);
                    } else {
                        await supabaseAdmin.from('token_transactions').insert({
                            user_id: userId,
                            amount: tokens,
                            type: 'pack_purchase',
                            description: `Pacote ${packType}   +${tokens} tokens adicionados`,
                        });
                        console.log(`  Token pack purchased for user ${userId}. Pack: ${packType}. New balance: ${newBalance}`);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                const customerId = subscription.customer as string;

                await supabaseAdmin
                    .from('profiles')
                    .update({ subscription_status: 'canceled' })
                    .eq('stripe_customer_id', customerId);

                console.log(`   Subscription canceled for customer: ${customerId}`);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;
                const customerId = subscription.customer as string;
                const status = subscription.status;
                const endDate = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : null;

                await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: status,
                        subscription_end_date: endDate,
                        stripe_subscription_id: subscription.id,
                    })
                    .eq('stripe_customer_id', customerId);

                console.log(`=  Subscription updated for customer: ${customerId}. Status: ${status}. Ends: ${endDate}`);
                break;
            }

            default:
                console.log(`Unhandled event: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error: any) {
        console.error('Unhandled Server Error: ', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
