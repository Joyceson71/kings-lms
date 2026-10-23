import { embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

export interface MaterialSource {
  title: string;
  url: string | null;
}

interface MatchedChunk {
  material_id: string;
  content: string;
  similarity: number;
}

export async function retrieveCourseMaterials(
  supabase: SupabaseClient,
  userId: string,
  role: 'student' | 'faculty' | 'admin',
  query: string,
  requestedCourseId?: string,
) {
  let courseIds: string[] = [];
  if (role === 'student') {
    const { data, error } = await supabase.from('course_enrollments').select('course_id').eq('student_id', userId);
    if (error) throw error;
    courseIds = (data ?? []).map(row => row.course_id);
  } else {
    let coursesQuery = supabase.from('courses').select('id');
    if (role === 'faculty') coursesQuery = coursesQuery.eq('created_by', userId);
    const { data, error } = await coursesQuery;
    if (error) throw error;
    courseIds = (data ?? []).map(row => row.id);
  }

  if (requestedCourseId) courseIds = courseIds.filter(id => id === requestedCourseId);
  if (courseIds.length === 0 || !query.trim() || !env.GEMINI_API_KEY) {
    return { context: '', sources: [] as MaterialSource[] };
  }

  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  const { embedding } = await embed({
    model: google.embedding(EMBEDDING_MODEL),
    value: query,
    providerOptions: {
      google: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: EMBEDDING_DIMENSIONS },
    },
  });

  const { data: matched, error: matchError } = await supabase.rpc('match_course_materials', {
    query_embedding: embedding,
    match_threshold: 0.25,
    match_count: 6,
    filter_course_ids: courseIds,
  });
  if (matchError) throw matchError;

  const chunks = (matched ?? []) as MatchedChunk[];
  if (chunks.length === 0) return { context: '', sources: [] as MaterialSource[] };

  const materialIds = [...new Set(chunks.map(chunk => chunk.material_id))];
  const { data: materials, error: materialError } = await supabase
    .from('course_materials')
    .select('id, title, file_path')
    .in('id', materialIds);
  if (materialError) throw materialError;

  const materialById = new Map((materials ?? []).map(material => [material.id, material]));
  const sources = [...new Map(chunks.map(chunk => {
    const material = materialById.get(chunk.material_id);
    return material ? [material.id, { title: material.title, url: material.file_path }] as const : null;
  }).filter((source): source is readonly [string, MaterialSource] => source !== null)).values()];

  const sourceNumber = new Map(sources.map((source, index) => [source.title + '\u0000' + source.url, index + 1]));
  const context = chunks.map(chunk => {
    const material = materialById.get(chunk.material_id);
    if (!material) return '';
    const number = sourceNumber.get(material.title + '\u0000' + material.file_path) ?? 1;
    return `[Source ${number}: ${material.title}]\n${chunk.content}`;
  }).filter(Boolean).join('\n\n');

  return { context, sources };
}
