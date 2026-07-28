import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenai() {
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  _openai = new OpenAI({ apiKey });
  return _openai;
}

export async function generateSowSummary(rawText: string): Promise<string> {
  const response = await getOpenai().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert contract analyst. Given a Statement of Work, generate a concise bulleted executive summary covering the key deliverables, boundaries, exclusions, and terms. Use bullet points with dashes.',
      },
      { role: 'user', content: `SOW Text:\n\n${rawText}` },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const summary = response.choices[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error('OpenAI returned empty or filtered summary');
  }
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
  const response = await getOpenai().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert project manager contract auditor. Compare the incoming client communication against the provided SOW contract text. Determine if the request is strictly within the defined scope, out-of-scope (scope creep), or unclear. Respond with a JSON object containing "verdict" ("in_scope", "out_of_scope", or "unclear") and "explanation" (1-2 sentence string).',
      },
      {
        role: 'user',
        content: `SOW Contract:\n${sowText}\n\nIncoming Client Message:\n${messageText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty evaluation');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned malformed JSON in evaluation');
  }

  const verdictRaw = typeof parsed.verdict === 'string' ? parsed.verdict : '';
  const explanation =
    typeof parsed.explanation === 'string' && parsed.explanation.length > 0
      ? parsed.explanation
      : 'No explanation provided.';

  if (!isValidVerdict(verdictRaw)) {
    return { verdict: 'unclear', explanation };
  }

  return { verdict: verdictRaw, explanation };
}
