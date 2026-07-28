import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { evaluateScope, type ScopeVerdict } from '../services/anthropic';
import { isValidUUID, sanitizeString } from '../services/validate';

const router = Router();

const VALID_CHANNELS = ['slack', 'email', 'api'];

router.post('/:client_id', async (req: Request, res: Response) => {
  try {
    const { client_id } = req.params;

    if (!isValidUUID(client_id)) {
      return res.status(400).json({ error: 'client_id must be a valid UUID' });
    }

    const { message_text, source_channel } = req.body;

    if (!message_text || typeof message_text !== 'string') {
      return res.status(400).json({ error: 'message_text is required and must be a string' });
    }

    if (!source_channel || typeof source_channel !== 'string') {
      return res.status(400).json({ error: 'source_channel is required and must be a string' });
    }

    const trimmedMessage = message_text.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ error: 'message_text cannot be empty or whitespace only' });
    }

    if (trimmedMessage.length > 50000) {
      return res.status(400).json({ error: 'message_text exceeds maximum length of 50000 characters' });
    }

    const channel = source_channel.trim().toLowerCase();
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({
        error: `Invalid source_channel. Must be one of: ${VALID_CHANNELS.join(', ')}`,
      });
    }

    const { data: sow, error: sowError } = await supabase()
      .from('sows')
      .select('raw_text')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sowError || !sow) {
      return res.status(404).json({ error: 'No active contract found for client' });
    }

    if (!sow.raw_text || sow.raw_text.trim().length === 0) {
      return res.status(422).json({ error: 'Active contract exists but has no text content' });
    }

    console.log(`Evaluating scope for client ${client_id}...`);
    const { verdict, explanation } = await evaluateScope(sow.raw_text, trimmedMessage);

    const validVerdict = isValidScopeVerdict(verdict) ? verdict : 'unclear';

    const { data: requestRecord, error: insertError } = await supabase()
      .from('requests')
      .insert({
        client_id,
        source_channel: channel,
        message_text: trimmedMessage,
        ai_verdict: validVerdict,
        explanation,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save request record' });
    }

    return res.status(200).json({
      verdict: validVerdict,
      explanation,
      request_id: requestRecord.id,
    });
  } catch (err) {
    console.error('POST /api/webhook/:client_id error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `Webhook processing failed: ${message}` });
  }
});

function isValidScopeVerdict(v: string): v is ScopeVerdict {
  return v === 'in_scope' || v === 'out_of_scope' || v === 'unclear';
}

export default router;
