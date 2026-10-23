import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type RouteHandler<RequestType extends Request> = (request: RequestType) => Promise<Response> | Response;

interface ApiHandlerOptions {
  route: string;
  auth?: boolean;
  bodySchema?: z.ZodType;
  querySchema?: z.ZodType;
}

function validationResponse(error: z.ZodError) {
  return NextResponse.json({
    error: {
      code: 'INVALID_REQUEST',
      message: 'The request contains invalid fields.',
      fields: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
    },
  }, { status: 400 });
}

export function withApiHandler<RequestType extends Request>(handler: RouteHandler<RequestType>, options: ApiHandlerOptions) {
  return async (request: RequestType): Promise<Response> => {
    let userId: string | null = null;
    try {
      if (options.auth !== false) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
        }
        userId = user.id;
      }

      if (options.bodySchema) {
        let body: unknown;
        try {
          body = await request.clone().json();
        } catch {
          return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } }, { status: 400 });
        }
        const result = options.bodySchema.safeParse(body);
        if (!result.success) return validationResponse(result.error);
      }

      if (options.querySchema) {
        const query = Object.fromEntries(new URL(request.url).searchParams.entries());
        const result = options.querySchema.safeParse(query);
        if (!result.success) return validationResponse(result.error);
      }

      const response = await handler(request);
      if (response.status >= 500) {
        console.error(`[${options.route}] server error`, { userId, status: response.status });
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } }, { status: response.status });
      }
      return response;
    } catch (error) {
      console.error(`[${options.route}] request failed`, { userId, error });
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } }, { status: 500 });
    }
  };
}
