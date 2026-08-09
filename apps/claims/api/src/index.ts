import express from 'express';
import cors from 'cors';
import { claims } from './data.js';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/claims', (req, res) => {
  const { status, payer } = req.query;
  let result = claims;
  if (typeof status === 'string' && status !== 'all') {
    result = result.filter((c) => c.status === status);
  }
  if (typeof payer === 'string' && payer !== 'all') {
    result = result.filter((c) => c.payer === payer);
  }
  res.json(result);
});

app.get('/api/claims/:id', (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) {
    res.status(404).json({ error: `Claim ${req.params.id} not found` });
    return;
  }
  res.json(claim);
});

app.get('/api/denials', (_req, res) => {
  const denials = claims
    .filter((c) => c.status === 'denied')
    .sort((a, b) => b.amount - a.amount);
  res.json(denials);
});

app.get('/api/metrics', (_req, res) => {
  const denied = claims.filter((c) => c.status === 'denied');
  const open = claims.filter((c) => c.status !== 'paid');
  const arDays =
    Math.round((open.reduce((sum, c) => sum + c.agingDays, 0) / Math.max(open.length, 1)) * 10) / 10;
  const cleanClaimRate =
    Math.round(((claims.length - denied.length) / claims.length) * 1000) / 10;
  const totalDeniedAmount = Math.round(denied.reduce((s, c) => s + c.amount, 0) * 100) / 100;
  res.json({ arDays, cleanClaimRate, totalDeniedAmount, openClaims: open.length });
});

const PORT = 4100;
app.listen(PORT, () => {
  console.log(`claims-api listening on http://localhost:${PORT}`);
});
