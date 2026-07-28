import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { isValidUUID } from '../services/validate';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { agency_id } = req.query;

    let query = supabase().from('clients').select('*');

    if (agency_id) {
      if (typeof agency_id !== 'string' || !isValidUUID(agency_id)) {
        return res.status(400).json({ error: 'agency_id must be a valid UUID' });
      }
      query = query.eq('agency_id', agency_id);
    }

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }

    return res.status(200).json({ clients: data || [] });
  } catch (err) {
    console.error('GET /api/clients error:', err);
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
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.status(200).json({ client: data });
  } catch (err) {
    console.error('GET /api/clients/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { agency_id, name, company } = req.body;

    if (!agency_id || !name || !company) {
      return res.status(400).json({ error: 'agency_id, name, and company are required' });
    }

    if (!isValidUUID(agency_id)) {
      return res.status(400).json({ error: 'agency_id must be a valid UUID' });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }

    if (typeof company !== 'string' || !company.trim()) {
      return res.status(400).json({ error: 'company must be a non-empty string' });
    }

    const { data: agencyCheck } = await supabase()
      .from('agencies')
      .select('id')
      .eq('id', agency_id)
      .single();

    if (!agencyCheck) {
      return res.status(400).json({ error: 'Referenced agency does not exist' });
    }

    const { data, error } = await supabase()
      .from('clients')
      .insert({ agency_id, name: name.trim(), company: company.trim() })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to create client' });
    }

    return res.status(201).json({ client: data });
  } catch (err) {
    console.error('POST /api/clients error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
