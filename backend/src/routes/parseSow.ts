import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../services/supabase';
import { generateSowSummary } from '../services/openai';
import { extractTextFromFile } from '../services/pdfParser';
import { isValidUUID } from '../services/validate';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

router.post('/', upload.single('sow_file'), async (req: Request, res: Response) => {
  try {
    const { agency_id, client_id } = req.body;

    if (!agency_id || !client_id) {
      return res.status(400).json({ error: 'agency_id and client_id are required' });
    }

    if (!isValidUUID(agency_id) || !isValidUUID(client_id)) {
      return res.status(400).json({ error: 'agency_id and client_id must be valid UUIDs' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'sow_file is required' });
    }

    if (req.file.size === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty' });
    }

    const rawText = await extractTextFromFile(req.file.buffer, req.file.mimetype);

    if (!rawText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the uploaded file' });
    }

    if (rawText.trim().length < 20) {
      return res.status(400).json({ error: 'Extracted text is too short to be a valid SOW' });
    }

    console.log(`Generating SOW summary for client ${client_id}...`);
    const summary = await generateSowSummary(rawText);

    const { data: sow, error } = await supabase
      .from('sows')
      .insert({ client_id, raw_text: rawText, summary })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'client_id does not reference an existing client' });
      }
      return res.status(500).json({ error: 'Failed to save SOW record' });
    }

    return res.status(201).json({ sow, summary });
  } catch (err) {
    console.error('POST /api/parse-sow error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `Failed to process SOW: ${message}` });
  }
});

export default router;
