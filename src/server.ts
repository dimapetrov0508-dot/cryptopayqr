import 'dotenv/config';
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Telegraf, Markup } from 'telegraf';

const app = Fastify({ logger: true, trustProxy: false });
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const orders = new Map<string, { id: string; userId: number; amountRub: number; status: 'pending'|'paid'; createdAt: string }>();

function validateTelegramInitData(raw: string, botToken: string): Record<string, string> {
  const params = new URLSearchParams(raw); const hash = params.get('hash');
  if (!hash || !botToken) throw new Error('Invalid Telegram credentials');
  params.delete('hash');
  const dataCheck = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (expected.length !== hash.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) throw new Error('Invalid Telegram signature');
  const authDate = Number(params.get('auth_date')); if (!authDate || Date.now()/1000 - authDate > 86400) throw new Error('Expired Telegram session');
  return Object.fromEntries(params.entries());
}

const auth = (request: any, reply: any) => {
  try { const data = validateTelegramInitData(String(request.headers['x-telegram-init-data'] || ''), process.env.TELEGRAM_BOT_TOKEN || ''); request.user = JSON.parse(data.user || '{}'); }
  catch { return reply.code(401).send({ error: 'Unauthorized' }); }
};

app.get('/api/health', async () => ({ ok: true }));
app.post('/api/payments/quote', { preHandler: auth }, async (request: any, reply) => {
  const body = z.object({ amountRub: z.number().positive().max(1_000_000) }).safeParse(request.body);
  if (!body.success) return reply.code(400).send({ error: 'Invalid amount' });
  const rate = 92.5; const feePct = 0.015; const usdt = body.data.amountRub / rate * (1 + feePct);
  return { amountRub: body.data.amountRub, rate, feePct, usdt: Number(usdt.toFixed(6)), network: 'BEP20', demo: true };
});
app.get('/api/me', { preHandler: auth }, async (request: any) => ({ id: request.user.id, username: request.user.username }));
app.post('/api/orders', { preHandler: auth }, async (request: any, reply) => {
  const body = z.object({ amountRub: z.number().int().positive().max(1_000_000) }).safeParse(request.body);
  if (!body.success) return reply.code(400).send({ error: 'Invalid amount' });
  const id = randomUUID(); const order = { id, userId: Number(request.user.id), amountRub: body.data.amountRub, status: 'pending' as const, createdAt: new Date().toISOString() }; orders.set(id, order);
  return reply.code(201).send({ orderId: id, amountRub: order.amountRub, status: order.status, demo: true });
});
app.get('/api/orders/:id', { preHandler: auth }, async (request: any, reply) => {
  const order = orders.get(request.params.id); if (!order || order.userId !== Number(request.user.id)) return reply.code(404).send({ error: 'Order not found' });
  return order;
});
app.get('/*', async (_request, reply) => reply.type('text/html').send(await readFile(path.join(publicDir, 'index.html'))));

const port = Number(process.env.PORT || 3000); await app.listen({ port, host: '127.0.0.1' });
console.log(`Mini App running at http://127.0.0.1:${port}`);

if (process.env.TELEGRAM_BOT_TOKEN) {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  const appUrl = process.env.PUBLIC_URL || 'https://your-https-domain.example';
  bot.start((ctx) => ctx.reply('Добро пожаловать в cryptopayQR. Откройте приложение для создания платежа.', Markup.inlineKeyboard([Markup.button.webApp('Открыть cryptopayQR', appUrl)])));
  bot.command('help', (ctx) => ctx.reply('Команды:\n/start — открыть приложение\n/balance — показать баланс (демо)\n/help — помощь'));
  bot.command('balance', (ctx) => ctx.reply('Баланс: 0 USDT (демо-режим)'));
  bot.catch((error) => app.log.error(error));
  bot.telegram.setMyCommands([{ command: 'start', description: 'Открыть приложение' }, { command: 'balance', description: 'Показать баланс' }, { command: 'help', description: 'Помощь' }]).catch((error) => app.log.error(error, 'Failed to set bot commands'));
  bot.launch({ dropPendingUpdates: true }).then(() => app.log.info('Telegram bot started with polling')).catch((error) => app.log.error(error, 'Telegram bot failed to start'));
  process.once('SIGINT', () => bot.stop('SIGINT')); process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else app.log.warn('TELEGRAM_BOT_TOKEN is not set; bot is disabled');
