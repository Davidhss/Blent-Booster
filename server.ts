import express from "express";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia" as any,
});

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.warn("CRITICAL WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in .env. Signup and admin features will fail.");
} else if (serviceRoleKey.startsWith('sb_publishable_')) {
  console.error("CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY appears to be a PUBLISHABLE (anon) key. Admin features will return 'Bearer token' errors. Please use the 'service_role' key from Supabase Dashboard.");
} else {
  console.log("Supabase service role key detected.");
}

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  serviceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || ""
);

const app = express();
const PORT = parseInt(process.env.PORT || process.env.API_PORT || '3001', 10);

// =============================================
// SECURITY MIDDLEWARE
// =============================================
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later." } as any
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Strict limit for auth/signup
  message: { error: "Too many signup attempts, please try again later." } as any
});
app.use("/api/auth/signup", authLimiter);

// Custom Authentication Middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};

// CORS restricted to app URL, but allow any localhost port in development
const allowedOrigin = process.env.VITE_APP_URL || "http://localhost:3000";
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isLocalhost = origin && /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (origin === allowedOrigin || isLocalhost || !origin) {
    res.header("Access-Control-Allow-Origin", origin || allowedOrigin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  next();
});

// PLAN TOKEN ALLOCATIONS
const PLAN_TOKENS: Record<string, number> = {
  monthly: 1000,
  quarterly: 3500,
  annual: 15000,
};

// PACK TOKEN AMOUNTS  
const PACK_TOKENS: Record<string, number> = {
  starter: 500,
  boost: 2000,
  pro: 5000,
};

// PACK STRIPE PRICE IDs (one-time purchases   create in Stripe Dashboard)
const PACK_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  boost: process.env.STRIPE_PRICE_BOOST || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
};

// =============================================
// Helper: Send Beautiful Email via SendGrid
// =============================================
const sendEmailViaSendGrid = async (toEmail: string, subject: string, htmlContent: string) => {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
  if (!SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY is not defined. No email sent.");
    throw new Error("SENDGRID_API_KEY not defined");
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
    });

    if (!sendgridRes.ok) {
      const sendgridErr = await sendgridRes.text();
      console.error("Erro ao enviar e-mail via SendGrid:", sendgridErr);
      throw new Error(`SendGrid API Error: ${sendgridErr}`);
    } else {
      console.log(`Email '${subject}' enviado para ${toEmail} com sucesso!`);
    }
  } catch (e: any) {
    console.error("Erro fatal ao enviar email:", e);
    throw e;
  }
};

// =============================================
// STRIPE WEBHOOK   must be before express.json()
// =============================================
app.post("/api/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig || "",
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const purchaseType = session.metadata?.purchase_type || 'subscription';

      if (!userId) break;

      if (purchaseType === 'subscription') {
        const planType = session.metadata?.plan_type || 'monthly';
        const tokens = PLAN_TOKENS[planType] || 1000;

        // Fetch subscription details from Stripe to get period end date
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
          // Log transaction
          await supabaseAdmin.from('token_transactions').insert({
            user_id: userId,
            amount: tokens,
            type: 'subscription_grant',
            description: `Plano ${planType}   ${tokens} tokens concedidos`,
          });
          console.log(`  Subscription activated for user ${userId}. Plan: ${planType}. Tokens set to: ${tokens}`);

          // Fetch user email to send welcome message
          try {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (user && user.email) {
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
                    <!-- HEADER -->
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
                    
                    <!-- BODY -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <p style="margin: 0 0 24px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                Olá! Seu pagamento do plano <strong style="color: #ffffff; text-transform: uppercase;">${planType}</strong> foi confirmado! A sua conta já foi atualizada e liberada com sucesso.
                            </p>
                            <p style="margin: 0 0 32px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                Prepare-se para criar conteúdos magnéticos e dominar o algoritmo. Aqui estão os seus próximos passos para extrair o máximo do BlentBoost:
                            </p>

                            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px;">🛠️ Primeiros Passos:</h3>
                                <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.7); line-height: 1.6;">
                                    <li style="margin-bottom: 12px;">Acesse a plataforma e conecte sua conta do Instagram.</li>
                                    <li style="margin-bottom: 12px;">Preencha seu perfil para que a IA entenda seu tom de voz e estilo.</li>
                                    <li>Gere seu primeiro post viral em segundos!</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${process.env.VITE_APP_URL || 'https://app.assessoriablent.com'}" style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #7e22ce); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);">
                                    ACESSAR O BLENTBOOST
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- FOOTER -->
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
              await sendEmailViaSendGrid(user.email, "Bem-vindo(a) ao BlentBoost! 🎉", welcomeHtml);
            }
          } catch (e) {
            console.error("Failed to send welcome email:", e);
          }
        }
      } else if (purchaseType === 'token_pack') {
        const packType = session.metadata?.pack_type || 'starter';
        const tokens = PACK_TOKENS[packType] || 500;

        // Get current balance first
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
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_customer_id', customerId);

      console.log(`   Subscription canceled for customer: ${customerId}`);
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

  res.json({ received: true });
});


// =============================================
// CANCEL SUBSCRIPTION
// =============================================
app.post("/api/user/cancel-subscription", authenticateUser, async (req: any, res) => {
  const userId = req.user.id;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: "Por favor, informe o motivo do cancelamento." });
  }

  try {
    // Get the user's subscription ID and email
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_subscription_id, email, name, subscription_plan')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    if (!profileData.stripe_subscription_id) {
      return res.status(400).json({ error: "Nenhuma assinatura ativa encontrada para cancelar." });
    }

    // Cancel at period end in Stripe (does not immediately cancel, lets user use until end)
    await stripe.subscriptions.update(profileData.stripe_subscription_id, {
      cancel_at_period_end: true,
    } as any);

    // Send email to support with the reason
    const cancelHtml = `
      <h2>Solicitação de Cancelamento de Assinatura</h2>
      <p><strong>Usuário:</strong> ${profileData.name || 'N/A'}</p>
      <p><strong>E-mail:</strong> ${profileData.email}</p>
      <p><strong>Plano:</strong> ${profileData.subscription_plan || 'N/A'}</p>
      <h3>Motivo do Cancelamento:</h3>
      <pre style="white-space: pre-wrap; font-family: sans-serif; background: #f5f5f5; padding: 12px; border-radius: 6px;">${reason}</pre>
      <p style="color: #888; font-size: 12px;">A assinatura foi configurada para não renovar ao fim do ciclo atual.</p>
    `;

    await sendEmailViaSendGrid(
      "contato@assessoriablent.com",
      `Cancelamento de Assinatura: ${profileData.email}`,
      cancelHtml
    );

    res.json({ success: true, message: "Assinatura cancelada. Você continua com acesso até o fim do período atual." });
  } catch (err: any) {
    console.error("Erro ao cancelar assinatura:", err);
    res.status(500).json({ error: "Ocorreu um erro ao processar o cancelamento." });
  }
});

app.use(express.json());

// =============================================
// TOKEN CONSUMPTION
// =============================================
const consumeTokensSchema = z.object({
  cost: z.number().nonnegative(),
  action: z.string().optional()
});

app.post("/api/consume-tokens", authenticateUser, async (req: any, res) => {
  const validation = consumeTokensSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid request data', details: validation.error.format() });
  }

  const { cost, action } = validation.data;
  const userId = req.user.id;

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('token_balance, is_unlimited')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Unlimited users bypass token check
  if (profile.is_unlimited) {
    return res.json({ success: true, newBalance: profile.token_balance, unlimited: true });
  }

  if (cost === 0) {
    return res.json({ success: true, newBalance: profile.token_balance });
  }

  if (profile.token_balance < cost) {
    return res.status(402).json({ success: false, error: 'insufficient_tokens', balance: profile.token_balance });
  }

  const newBalance = profile.token_balance - cost;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ token_balance: newBalance })
    .eq('id', userId);

  if (updateError) {
    return res.status(500).json({ success: false, error: 'Failed to update balance' });
  }

  // Log transaction
  await supabaseAdmin.from('token_transactions').insert({
    user_id: userId,
    amount: -cost,
    type: 'consumption',
    description: action || 'Uso de funcionalidade',
  });

  res.json({ success: true, newBalance });
});

// =============================================
// AUTH: CREATE PRE-CONFIRMED USER (BYPASS EMAIL CONFIRMATION)
// =============================================
app.post("/api/auth/signup", async (req, res) => {
  console.log('--- SIGNUP ATTEMPT ---');
  console.log('Body:', req.body);
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    console.warn('Signup failed: Missing fields');
    return res.status(400).json({ error: 'Email, password and name are required' });
  }

  // Basic password complexity check
  if (password.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  if (!serviceRoleKey) {
    return res.status(500).json({
      error: 'Configuração incompleta no servidor: SUPABASE_SERVICE_ROLE_KEY não encontrada no arquivo .env.'
    });
  }

  try {
    // Create user via Admin API with auto-confirm
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('Supabase admin signup error:', JSON.stringify(authError, null, 2));

      // Better error message for the common "Bearer token" issue
      if (authError.message.toLowerCase().includes("bearer token")) {
        return res.status(500).json({
          error: "Erro de configuração no servidor: O endpoint de cadastro requer uma chave 'service_role' válida ou o servidor precisa ser reiniciado para carregar o arquivo .env."
        });
      }

      return res.status(400).json({ error: authError.message });
    }

    res.json({ success: true, user: userData.user });
  } catch (err: any) {
    console.error('Fatal signup error:', err.message);
    res.status(500).json({ error: "Ocorreu um erro interno ao processar seu cadastro." });
  }
});

// =============================================
// AUTH: FORGOT PASSWORD (SENDGRID)
// =============================================
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "O e-mail é obrigatório." });
  }

  try {
    // Generate recovery link via Supabase admin with redirectTo pointing to our reset page.
    // When clicked, Supabase verifies the token and redirects to our page with #access_token=...&type=recovery in the hash.
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5174';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/reset-password`
      }
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError.message);
      // Don't leak whether the email exists or not for security reasons, just say ok
      return res.json({ success: true, message: "Se o e-mail existir, um link de recuperação será enviado." });
    }

    // Use Supabase's own action_link in the email.
    // When clicked, Supabase verifies the token and redirects to our /reset-password
    // page with #access_token=...&type=recovery in the URL hash.
    const resetUrl = linkData.properties.action_link;

    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de Senha - BlentBoost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #06060f; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #06060f;">
              <tr>
                  <td align="center" style="padding: 40px 0;">
                      <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #14141e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden;">
                          <!-- HEADER -->
                          <tr>
                              <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                  <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7e22ce); padding: 14px 16px; border-radius: 16px; margin-bottom: 24px;">
                                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="white"/>
                                      </svg>
                                  </div>
                                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Redefinição de Senha</h1>
                              </td>
                          </tr>
                          
                          <!-- BODY -->
                          <tr>
                              <td style="padding: 20px 40px 40px 40px;">
                                  <p style="margin: 0 0 24px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                      Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color: #ffffff;">BlentBoost</strong> associada a este e-mail.
                                  </p>
                                  <p style="margin: 0 0 32px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                      Se foi você quem fez a solicitação, clique no botão abaixo para criar uma nova senha:
                                  </p>
                                  
                                  <div style="text-align: center;">
                                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #7e22ce); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);">
                                          REDEFINIR MINHA SENHA
                                      </a>
                                  </div>
                                  
                                  <p style="margin: 32px 0 0 0; color: rgba(255, 255, 255, 0.4); font-size: 14px; line-height: 1.5; text-align: center;">
                                      Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança. Sua senha não será alterada até que você acesse o link acima e crie uma nova.
                                  </p>
                              </td>
                          </tr>
                          
                          <!-- FOOTER -->
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
      </html>
    `;

    // Send email via SendGrid API
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";

    const sendgridRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
            subject: "Redefina sua senha - BlentBoost"
          }
        ],
        from: {
          email: "contato@assessoriablent.com",
          name: "BlentBoost"
        },
        content: [
          {
            type: "text/html",
            value: htmlEmail
          }
        ]
      })
    });

    if (!sendgridRes.ok) {
      const sendgridErr = await sendgridRes.text();
      console.error("Erro ao enviar e-mail via SendGrid:", sendgridErr);
      return res.status(500).json({ error: "Falha ao enviar e-mail de recuperação." });
    }

    res.json({ success: true, message: "E-mail de recuperação enviado com sucesso." });
  } catch (err: any) {
    console.error("Erro na rota de forgot-password:", err.message);
    res.status(500).json({ error: "Ocorreu um erro interno ao solicitar a recuperação." });
  }
});

// =============================================
// BUG REPORT & ADMIN BUG MANAGEMENT
// =============================================
app.post("/api/report-bug", async (req, res) => {
  const { tool, description, userEmail } = req.body;

  if (!description) {
    return res.status(400).json({ error: "A descrição do bug é obrigatória." });
  }

  try {
    let userId = null;
    if (userEmail) {
      // Find the user ID based on email if possible
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email').eq('email', userEmail);
      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
      }
    }

    // Insert into DB
    const { error: insertError } = await supabaseAdmin.from('bug_reports').insert({
      user_id: userId,
      user_email: userEmail || 'unknown@example.com',
      tool: tool || 'Geral',
      description
    });

    if (insertError) {
      console.error("Erro ao salvar bug no banco:", insertError);
    }

    const htmlEmail = `
      <h2>Novo Relatório de Bug - BlentBoost</h2>
      <p><strong>Usuário (Email):</strong> ${userEmail || 'Não informado'}</p>
      <p><strong>Ferramenta/Seção:</strong> ${tool || 'Geral'}</p>
      <h3>Descrição:</h3>
      <pre style="white-space: pre-wrap; font-family: sans-serif;">${description}</pre>
    `;

    try {
      await sendEmailViaSendGrid(
        "contato@assessoriablent.com",
        `Report de Bug: ${tool || 'Geral'} - ${userEmail || 'Usuário'}`,
        htmlEmail
      );
    } catch (e) {
      console.error("Falha ao enviar e-mail de notificação de bug interno:", e);
    }

    res.json({ success: true, message: "Relatório enviado com sucesso." });
  } catch (err: any) {
    console.error("Erro na rota de report-bug:", err);
    res.status(500).json({ error: "Ocorreu um erro interno ao enviar o relatório." });
  }
});

// GET all bugs
app.get("/api/admin/bug-reports", async (req: any, res) => {
  try {
    // Fetch all bugs
    const { data: bugs, error } = await supabaseAdmin
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch profile info for bugs that have user_id
    const userIds = (bugs || []).map((b: any) => b.user_id).filter(Boolean);
    let profileMap: any = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, name, "avatarUrl"').in('id', userIds);
      profileMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
    }

    // Calculate total bugs per user
    const userBugCounts = (bugs || []).reduce((acc: any, curr: any) => {
      acc[curr.user_email] = (acc[curr.user_email] || 0) + 1;
      return acc;
    }, {});

    const enrichedBugs = (bugs || []).map((b: any) => ({
      ...b,
      profiles: profileMap[b.user_id] || null,
      total_reports_by_user: userBugCounts[b.user_email] || 1
    }));

    res.json({ bugs: enrichedBugs });
  } catch (err: any) {
    console.error("Error fetching bugs:", err);
    res.status(500).json({ error: err.message });
  }
});

// Resolve bug
app.post("/api/admin/bug-reports/:id/resolve", async (req: any, res) => {
  try {
    const bugId = req.params.id;
    const { error } = await supabaseAdmin.from('bug_reports').update({ status: 'resolved' }).eq('id', bugId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error resolving bug:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send thank you email
app.post("/api/admin/bug-reports/:id/thank-you", async (req: any, res) => {
  try {
    const bugId = req.params.id;

    // Fetch bug details
    const { data: bug, error } = await supabaseAdmin.from('bug_reports').select('*').eq('id', bugId).single();
    if (error || !bug) throw error || new Error("Bug not found");

    if (!bug.user_email || bug.user_email === 'unknown@example.com') {
      return res.status(400).json({ error: "Nenhum e-mail válido associado a este bug." });
    }

    const appUrl = process.env.VITE_APP_URL || 'https://app.assessoriablent.com';

    // Beautiful HTML Email using the reference style
    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agradecimento - BlentBoost</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #06060f; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #06060f;">
              <tr>
                  <td align="center" style="padding: 40px 0;">
                      <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #14141e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden;">
                          <!-- HEADER -->
                          <tr>
                              <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                  <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7e22ce); padding: 14px 16px; border-radius: 16px; margin-bottom: 24px;">
                                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                                      </svg>
                                  </div>
                                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Obrigado por Ajudar! 💜</h1>
                              </td>
                          </tr>
                          
                          <!-- BODY -->
                          <tr>
                              <td style="padding: 20px 40px 40px 40px;">
                                  <p style="margin: 0 0 24px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                      Olá! Toda a equipe do <strong style="color: #ffffff;">BlentBoost</strong> quer te agradecer imensamente pelo bug que você reportou recentemente na ferramenta de <strong>${bug.tool}</strong>.
                                  </p>
                                  <p style="margin: 0 0 32px 0; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                                      É graças à atenção impecável de usuários como você que conseguimos manter a plataforma rápida, estável e livre de erros. Seu relato já foi analisado e o problema está resolvido!
                                  </p>
                                  
                                  <div style="text-align: center;">
                                      <a href="${appUrl}" style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #7e22ce); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);">
                                          VOLTAR AO BLENTBOOST
                                      </a>
                                  </div>
                              </td>
                          </tr>
                          
                          <!-- FOOTER -->
                          <tr>
                              <td style="padding: 24px 40px; background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                                  <p style="margin: 0; color: rgba(255, 255, 255, 0.3); font-size: 12px;">
                                      &copy; 2026 BlentBoost. Feito com cuidado por Assesoria Blent.
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    await sendEmailViaSendGrid(bug.user_email, "Obrigado pelo seu report no BlentBoost! 🚀", htmlEmail);

    res.json({ success: true, message: "E-mail enviado com sucesso." });
  } catch (err: any) {
    console.error("Error sending thank you email:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// INSTAGRAM PUBLISHING
// =============================================
app.post("/api/instagram/publish", authenticateUser, async (req: any, res) => {
  const { postId, imageUrl, caption } = req.body;
  const userId = req.user.id;

  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

  try {
    // 1. Buscar as credenciais do usuário para o Instagram
    const { data: socialAccount, error: socialError } = await supabaseAdmin
      .from('user_social_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .single();

    if (socialError || !socialAccount) {
      return res.status(404).json({ error: "Conta do Instagram não conectada" });
    }

    const { access_token, platform_user_id } = socialAccount;

    // 2. Criar o container de mídia (Media Container)
    const containerResponse = await fetch(`https://graph.facebook.com/v19.0/${platform_user_id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: access_token
      })
    });

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || !containerData.id) {
      console.error("Erro ao criar container:", containerData);
      return res.status(500).json({ error: "Erro ao preparar mídia no Instagram", details: containerData });
    }

    const creationId = containerData.id;

    // 3. Publicar o container
    const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${platform_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: access_token
      })
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || !publishData.id) {
      console.error("Erro ao publicar mídia:", publishData);
      return res.status(500).json({ error: "Erro ao publicar no Instagram", details: publishData });
    }

    // 4. Atualizar o banco de dados se tivermos o postId
    if (postId) {
      await supabaseAdmin
        .from('planner_posts')
        .update({
          status: 'PUBLISHED',
          is_posted: true,
          ig_container_id: creationId,
          ig_media_id: publishData.id
        })
        .eq('id', postId)
        .eq('user_id', userId); // Ensure user owns the post
    }

    res.json({ success: true, ig_media_id: publishData.id });
  } catch (err: any) {
    console.error("Internal Instagram Publish Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Rota para ser chamada por um CRON (ex: GitHub Actions, EasyCron, Supabase Edge Function Cron)
 * Ela processa posts agendados que chegaram no horário de publicação.
 */
app.post("/api/instagram/process-scheduled", async (req, res) => {
  try {
    const now = new Date().toISOString();

    // 1. Buscar posts agendados que já passaram do horário e ainda não foram postados
    const { data: scheduledPosts, error: fetchError } = await supabaseAdmin
      .from('planner_posts')
      .select('*, profiles(id)')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_time', now)
      .eq('is_posted', false);

    if (fetchError) throw fetchError;

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return res.json({ message: "Nenhum post agendado para processar agora." });
    }

    const results = [];

    // 2. Iterar e publicar (Para produção, o ideal é usar uma fila paralela)
    for (const post of scheduledPosts) {
      try {
        // Buscar conta social do usuário
        const { data: socialAccount } = await supabaseAdmin
          .from('user_social_accounts')
          .select('*')
          .eq('user_id', post.user_id)
          .eq('platform', 'instagram')
          .single();

        if (!socialAccount) {
          await supabaseAdmin.from('planner_posts').update({ status: 'ERROR' }).eq('id', post.id);
          results.push({ id: post.id, status: 'error', reason: 'Social account not found' });
          continue;
        }

        const { access_token, platform_user_id } = socialAccount;

        // Criar Container
        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${platform_user_id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: post.image_url, caption: post.caption, access_token })
        });
        const containerData = await containerRes.json();

        if (!containerRes.ok) throw new Error(JSON.stringify(containerData));

        // Publicar
        const publishRes = await fetch(`https://graph.facebook.com/v19.0/${platform_user_id}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: containerData.id, access_token })
        });
        const publishData = await publishRes.json();

        if (!publishRes.ok) throw new Error(JSON.stringify(publishData));

        // Sucesso
        await supabaseAdmin
          .from('planner_posts')
          .update({
            status: 'PUBLISHED',
            is_posted: true,
            ig_media_id: publishData.id
          })
          .eq('id', post.id);

        results.push({ id: post.id, status: 'success' });
      } catch (postErr: any) {
        console.error(`Erro ao processar post ${post.id}:`, postErr);
        await supabaseAdmin.from('planner_posts').update({ status: 'ERROR' }).eq('id', post.id);
        results.push({ id: post.id, status: 'error', details: postErr.message });
      }
    }

    res.json({ processed: scheduledPosts.length, results });
  } catch (err: any) {
    console.error("Cron Process Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// CREATE STRIPE CHECKOUT FOR TOKEN PACKS
// =============================================
app.post("/api/create-checkout-session", async (req, res) => {
  const { userId, userEmail, packType } = req.body;

  if (!userId || !packType) {
    return res.status(400).json({ error: 'userId and packType are required' });
  }

  const priceId = PACK_PRICE_IDS[packType];
  if (!priceId) {
    return res.status(400).json({ error: `No Stripe price configured for pack: ${packType}. Set STRIPE_PRICE_${packType.toUpperCase()} in .env` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: {
        purchase_type: 'token_pack',
        pack_type: packType,
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?token_purchase=success`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?token_purchase=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// ADMIN: Get user token transactions
// =============================================
app.get("/api/admin/transactions/:userId", async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabaseAdmin
    .from('token_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// =============================================
// EXISTING API Routes
// =============================================
app.get("/api/profile/:email", async (req, res) => {
  const { email } = req.params;
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
  if (user) {
    res.json(user);
  } else {
    const { data: newUser } = await supabaseAdmin.from('users').insert({
      email, name: "Seu Nome", handle: "seu_arroba", avatarUrl: "https://picsum.photos/seed/user/200/200"
    }).select().single();
    res.json(newUser || {});
  }
});

app.post("/api/profile", async (req, res) => {
  const { email, name, handle, avatarUrl, bio } = req.body;
  await supabaseAdmin.from('users').update({
    name, handle, avatarUrl, bio
  }).eq('email', email);
  res.json({ success: true });
});

app.get("/api/library/:email", async (req, res) => {
  const { email } = req.params;
  const { data: items } = await supabaseAdmin.from('library').select('*').eq('user_email', email).order('created_at', { ascending: false });
  if (items) {
    res.json(items.map((item: any) => {
      try {
        return { ...item, content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content };
      } catch (e) { return item; }
    }));
  } else {
    res.json([]);
  }
});

app.post("/api/library", async (req, res) => {
  const { email, type, content } = req.body;
  await supabaseAdmin.from('library').insert({
    user_email: email, type, content: typeof content === 'string' ? JSON.parse(content) : content
  });
  res.json({ success: true });
});

app.delete("/api/library/:id", async (req, res) => {
  const { id } = req.params;
  await supabaseAdmin.from('library').delete().eq('id', id);
  res.json({ success: true });
});

// Bug Report Endpoint
app.post("/api/bug-report", async (req, res) => {
  const { tool, description, userEmail } = req.body;
  if (!tool || !description) {
    res.status(400).json({ error: "Tool and description are required" });
    return;
  }

  try {
    const { error } = await supabaseAdmin.from('bug_reports').insert({
      user_email: userEmail || 'Desconhecido', tool, description
    });
    if (error) throw error;
  } catch (dbErr) {
    console.error("Failed to save bug report to DB:", dbErr);
  }

  try {
    const bugHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Bug - BlentBoost</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06060f; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #06060f;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a0f14; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 24px; overflow: hidden;">
                    <!-- HEADER -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 14px 16px; border-radius: 16px; margin-bottom: 24px;">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Novo Bug Reportado no BlentBoost</h1>
                        </td>
                    </tr>
                    
                    <!-- BODY -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                <p style="margin: 0 0 12px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;"><strong>Usuário:</strong> <span style="color: #ffffff;">${userEmail}</span></p>
                                <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;"><strong>Ferramenta:</strong> <span style="color: #fca5a5; font-weight: bold;">${tool}</span></p>
                            </div>

                            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px;">
                                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px;">Descrição do Problema:</h3>
                                <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmailViaSendGrid('assessoriablent@gmail.com', `Alerta de Bug no CreatorBoost - ${tool}`, bugHtml);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Email send error:", error.message);
    res.json({ success: true, warning: 'Saved to DB but email failed to send.' });
  }
});

// Lead Capture Endpoint
app.post("/api/lead", async (req, res) => {
  const { name, email, phone, plan, price } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  try {
    const leadId = Math.random().toString(36).substring(2, 11);
    const { error } = await supabaseAdmin.from('leads').insert({
      id: leadId, name, email, phone, plan_name: plan, plan_price: price
    });
    if (error) throw error;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      await transporter.sendMail({
        from: `"Creator Boost App" <${process.env.SMTP_USER}>`,
        to: 'assessoriablent@gmail.com',
        subject: `Nova Lead CreatorBoost - ${plan}`,
        text: `Nova Lead:\n\nNome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nPlano: ${plan} (R$${price})`,
        html: `<h2>Nova Lead CreatorBoost</h2><ul><li><strong>Nome:</strong> ${name}</li><li><strong>Email:</strong> ${email}</li><li><strong>Telefone:</strong> ${phone}</li><li><strong>Plano:</strong> ${plan} (R$${price})</li></ul>`
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Lead processing error:", error.message);
    res.status(500).json({ error: "Failed to process lead" });
  }
});

// =============================================
// SERVE FRONTEND STATIC FILES (for Hostinger / production)
// =============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

// Serve React build in production
app.use(express.static(distPath));

// Catch-all: serve index.html for any non-API route (SPA routing)
app.get('*', (req, res) => {
  // Don't catch /api routes — those should 404 if not matched
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
