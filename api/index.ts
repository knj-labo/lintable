import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

type Bindings = {
  LINTABLE_KV: KVNamespace;
  // Add D1 if needed: DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for browser extension
app.use(
  '*',
  cors({
    origin: ['chrome-extension://*', 'http://localhost:*'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'lintable-api' });
});

// Content endpoint - fetch and process content
const ContentSchema = z.object({
  url: z.string().url(),
  selector: z.string().optional(),
});

app.post('/content', async (c) => {
  try {
    const body = await c.req.json();
    const { url, selector: _selector } = ContentSchema.parse(body);

    // TODO: Implement content fetching logic with selector
    // For now, return mock data
    return c.json({
      url,
      content: `Sample content from ${url}`,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Save draft endpoint
const DraftSchema = z.object({
  url: z.string().url(),
  content: z.string(),
  corrections: z
    .array(
      z.object({
        original: z.string(),
        corrected: z.string(),
        ruleId: z.string(),
      }),
    )
    .optional(),
});

app.post('/save-draft', async (c) => {
  try {
    const body = await c.req.json();
    const draft = DraftSchema.parse(body);

    // Save to KV
    const key = `draft:${Date.now()}:${btoa(draft.url).slice(0, 10)}`;
    await c.env.LINTABLE_KV.put(key, JSON.stringify(draft), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });

    return c.json({
      success: true,
      key,
      savedAt: new Date().toISOString(),
    });
  } catch (_error) {
    return c.json({ error: 'Failed to save draft' }, 400);
  }
});

// Rules endpoint - return operational levels
app.get('/rules', (c) => {
  // This could be stored in KV or D1 for dynamic updates
  return c.json({
    levels: {
      L0: {
        name: 'Minimal',
        description: 'Only critical errors',
        rules: ['proofdict'],
      },
      L1: {
        name: 'Basic',
        description: 'Common style issues',
        rules: ['proofdict', 'no-mix-dearu-desumasu'],
      },
      L2: {
        name: 'Standard',
        description: 'Standard technical writing',
        rules: ['proofdict', 'no-mix-dearu-desumasu', 'sentence-length'],
      },
      L3: {
        name: 'Strict',
        description: 'All rules enabled',
        rules: ['all'],
      },
    },
    defaultLevel: 'L1',
  });
});

// Stats endpoint (optional)
app.get('/stats', async (c) => {
  // Could track usage statistics
  const stats = (await c.env.LINTABLE_KV.get('stats', 'json')) || {
    totalLints: 0,
    totalDrafts: 0,
  };

  return c.json(stats);
});

export default app;
