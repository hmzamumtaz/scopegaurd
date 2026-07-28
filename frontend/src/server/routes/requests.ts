import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { isValidUUID } from '../services/validate';

const VALID_VERDICTS = ['in_scope', 'out_of_scope', 'unclear'];
const VALID_STATUSES = ['pending', 'invoiced', 'dismissed'];

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { client_id, ai_verdict, status, limit: limitStr } = req.query;
    const limit = Math.min(Math.max(parseInt(String(limitStr || '50'), 10) || 50, 1), 200);

    let query = supabase().from('requests').select(`
      *,
      clients!inner(name, company)
    `);

    if (client_id) {
      if (typeof client_id !== 'string' || !isValidUUID(client_id)) {
        return res.status(400).json({ error: 'client_id must be a valid UUID' });
      }
      query = query.eq('client_id', client_id);
    }

    if (ai_verdict) {
      if (typeof ai_verdict !== 'string' || !VALID_VERDICTS.includes(ai_verdict)) {
        return res.status(400).json({
          error: `ai_verdict must be one of: ${VALID_VERDICTS.join(', ')}`,
        });
      }
      query = query.eq('ai_verdict', ai_verdict);
    }

    if (status) {
      if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    return res.status(200).json({ requests: data || [] });
  } catch (err) {
    console.error('GET /api/requests error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'id must be a valid UUID' });
    }

    const { data, error } = await supabase()
      .from('requests')
      .select(`
        *,
        clients(name, company)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json({ request: data });
  } catch (err) {
    console.error('GET /api/requests/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'id must be a valid UUID' });
    }

    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const { data, error } = await supabase()
      .from('requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json({ request: data });
  } catch (err) {
    console.error('PATCH /api/requests/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
