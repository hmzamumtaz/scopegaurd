import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { isValidUUID } from '../services/validate';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { client_id } = req.query;

    let query = supabase().from('sows').select('*');

    if (client_id) {
      if (typeof client_id !== 'string' || !isValidUUID(client_id)) {
        return res.status(400).json({ error: 'client_id must be a valid UUID' });
      }
      query = query.eq('client_id', client_id);
    }

    query = query.order('created_at', { ascending: false }).limit(50);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch SOWs' });
    }

    return res.status(200).json({ sows: data || [] });
  } catch (err) {
    console.error('GET /api/sows error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/latest/:client_id', async (req: Request, res: Response) => {
  try {
    const { client_id } = req.params;

    if (!isValidUUID(client_id)) {
      return res.status(400).json({ error: 'client_id must be a valid UUID' });
    }

    const { data, error } = await supabase()
      .from('sows')
      .select('*')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'No SOW found for this client' });
    }

    return res.status(200).json({ sow: data });
  } catch (err) {
    console.error('GET /api/sows/latest/:client_id error:', err);
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
      .from('sows')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'SOW not found' });
    }

    return res.status(200).json({ sow: data });
  } catch (err) {
    console.error('GET /api/sows/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
