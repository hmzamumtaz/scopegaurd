import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { isValidUUID, isValidEmail } from '../services/validate';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch agencies' });
    }

    return res.status(200).json({ agencies: data || [] });
  } catch (err) {
    console.error('GET /api/agencies error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'id must be a valid UUID' });
    }

    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    return res.status(200).json({ agency: data });
  } catch (err) {
    console.error('GET /api/agencies/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, owner_email } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' });
    }

    if (!owner_email || typeof owner_email !== 'string' || !owner_email.trim()) {
      return res.status(400).json({ error: 'owner_email is required and must be a non-empty string' });
    }

    if (!isValidEmail(owner_email.trim())) {
      return res.status(400).json({ error: 'owner_email must be a valid email address' });
    }

    const { data, error } = await supabase
      .from('agencies')
      .insert({ name: name.trim(), owner_email: owner_email.trim() })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to create agency' });
    }

    return res.status(201).json({ agency: data });
  } catch (err) {
    console.error('POST /api/agencies error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
