import { NextResponse } from 'next/server';
import { embedMany } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import pdfParse from 'pdf-parse';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/handler';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { getRole } from '@/lib/getRole';

export const runtime = 'nodejs';

const BodySchema = z.object({ material_id: z.string().uuid() }).strict();

function splitIntoChunks(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const chunks: string[] = [];
  const chunkSize = 3200;
  const overlap = 320;
  let cursor = 0;

  while (cursor < normalized.length) {
    let end = Math.min(cursor + chunkSize, normalized.length);
    if (end < normalized.length) {
      const sentenceBreak = normalized.lastIndexOf('. ', end);
      if (sentenceBreak > cursor + chunkSize * 0.65) end = sentenceBreak + 1;
    }
    const content = normalized.slice(cursor, end).trim();
    if (content.length >= 80) chunks.push(content);
    if (end >= normalized.length) break;
    cursor = Math.max(end - overlap, cursor + 1);
  }
  return chunks;
}

async function handlePOST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!env.GEMINI_API_KEY) return NextResponse.json({ error: 'Material indexing is unavailable until GEMINI_API_KEY is configured.' }, { status: 503 });

  const parsedBody = BodySchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'A valid material_id is required.', fields: parsedBody.error.issues } }, { status: 400 });
  }

  const { data: material, error: materialError } = await supabase
    .from('course_materials')
    .select('id, course_id, type, file_path')
    .eq('id', parsedBody.data.material_id)
    .single();
  if (materialError || !material) return NextResponse.json({ error: 'Material not found or not accessible.' }, { status: 404 });

  const role = await getRole(supabase, user.id);
  if (role === 'student') return NextResponse.json({ error: 'Faculty access is required to index course materials.' }, { status: 403 });

  if (!material.file_path || material.type.toLowerCase() === 'link') {
    return NextResponse.json({ indexed: 0, skipped: true, reason: 'Web links are not indexed automatically.' });
  }

  const materialUrl = new URL(material.file_path);
  const supabaseUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  const allowedPathPrefix = '/storage/v1/object/public/course_materials/';
  if (materialUrl.origin !== supabaseUrl.origin || !materialUrl.pathname.includes(allowedPathPrefix)) {
    return NextResponse.json({ error: 'Only uploaded course files can be indexed.' }, { status: 400 });
  }

  const response = await fetch(materialUrl, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return NextResponse.json({ error: 'Could not read the uploaded course file.' }, { status: 422 });
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > 15 * 1024 * 1024) return NextResponse.json({ error: 'Files larger than 15 MB cannot be indexed.' }, { status: 413 });
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > 15 * 1024 * 1024) return NextResponse.json({ error: 'Files larger than 15 MB cannot be indexed.' }, { status: 413 });

  let extractedText: string;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/pdf') || buffer.subarray(0, 4).toString() === '%PDF') {
    extractedText = (await pdfParse(buffer, { max: 200 })).text;
  } else if (contentType.startsWith('text/') || /\.(txt|md|csv)$/i.test(material.file_path)) {
    extractedText = buffer.toString('utf8');
  } else {
    return NextResponse.json({ error: 'Only PDF, TXT, Markdown, or CSV files can be indexed.' }, { status: 415 });
  }

  const chunks = splitIntoChunks(extractedText);
  if (chunks.length === 0) return NextResponse.json({ error: 'No readable text was found in this file.' }, { status: 422 });

  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  const vectors: number[][] = [];
  for (let offset = 0; offset < chunks.length; offset += 64) {
    const batch = chunks.slice(offset, offset + 64);
    const result = await embedMany({
      model: google.embedding('gemini-embedding-001'),
      values: batch,
      maxRetries: 2,
      providerOptions: {
        google: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 768 },
      },
    });
    vectors.push(...result.embeddings);
  }

  const { error: deleteError } = await supabase.from('course_material_chunks').delete().eq('material_id', material.id);
  if (deleteError) throw deleteError;

  const rows = chunks.map((content, index) => ({
    course_id: material.course_id,
    material_id: material.id,
    content,
    embedding: vectors[index],
  }));
  const { error: insertError } = await supabase.from('course_material_chunks').insert(rows);
  if (insertError) throw insertError;

  return NextResponse.json({ indexed: rows.length });
}

export const POST = withApiHandler(handlePOST, {
  route: '/api/resources/ingest POST',
  auth: true,
  bodySchema: BodySchema,
});
