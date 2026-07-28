import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;

function getAnthropic() {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }
  _anthropic = new Anthropic({ apiKey });
  return _anthropic;
}

export async function generateSowSummary(rawText: string): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1000,
    system:
      'You are an expert contract analyst. Given a Statement of Work, generate a concise bulleted executive summary covering the key deliverables, boundaries, exclusions, and terms. Use bullet points with dashes.',
    messages: [{ role: 'user', content: `SOW Text:\n\n${rawText}` }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  const summary = block.text.trim();
  if (!summary) throw new Error('Claude returned empty summary');
  return summary;
}

export type ScopeVerdict = 'in_scope' | 'out_of_scope' | 'unclear';

export interface ScopeEvaluation {
  verdict: ScopeVerdict;
  explanation: string;
}

function isValidVerdict(v: string): v is ScopeVerdict {
  return v === 'in_scope' || v === 'out_of_scope' || v === 'unclear';
}

export async function evaluateScope(
  sowText: string,
  messageText: string
): Promise<ScopeEvaluation> {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 500,
    system:
      'You are an expert project manager contract auditor. Compare the incoming client communication against the provided SOW contract text. Determine if the request is strictly within the defined scope, out-of-scope (scope creep), or unclear. Respond with a JSON object only — no markdown, no code fences. The object must have "verdict" ("in_scope", "out_of_scope", or "unclear") and "explanation" (1-2 sentence string).',
    messages: [
      {
        role: 'user',
        content: `SOW Contract:\n${sowText}\n\nIncoming Client Message:\n${messageText}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== 'text' || !block.text.trim()) {
    throw new Error('Claude returned empty evaluation');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(block.text.trim());
  } catch {
    throw new Error('Claude returned malformed JSON in evaluation');
  }

  const verdictRaw = typeof parsed.verdict === 'string' ? parsed.verdict : '';
  const explanation =
    typeof parsed.explanation === 'string' && parsed.explanation.length > 0
      ? parsed.explanation
      : 'No explanation provided.';

  if (!isValidVerdict(verdictRaw)) return { verdict: 'unclear', explanation };
  return { verdict: verdictRaw, explanation };
}
