import fs from 'fs';
import path from 'path';
import os from 'os';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parsing error, falling back to raw text:', err);
    return buffer.toString('utf-8');
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (mimetype === 'application/pdf') {
    return extractTextFromPdf(buffer);
  }
  return buffer.toString('utf-8');
}
