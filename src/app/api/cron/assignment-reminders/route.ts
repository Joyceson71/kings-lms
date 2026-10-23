import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import webpush from 'web-push';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/handler';
import { createServiceClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export const maxDuration = 60;

if (env.VAPID_SUBJECT && env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

function validSecret(provided: string, expected: string) {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

async function handleGET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: { code: 'CRON_NOT_CONFIGURED', message: 'Reminder delivery is not configured.' } }, { status: 503 });
  }
  const headerSecret = request.headers.get('x-cron-secret');
  const authSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const provided = headerSecret ?? authSecret ?? '';
  if (!validSecret(provided, env.CRON_SECRET)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron authorization.' } }, { status: 401 });
  }

  const service = createServiceClient();
  const now = Date.now();
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  const canEmail = Boolean(resend && env.RESEND_FROM_EMAIL);
  const canPush = Boolean(env.VAPID_SUBJECT && env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const offset of [24, 2] as const) {
    const lower = new Date(now + (offset - 1) * 60 * 60 * 1000).toISOString();
    const upper = new Date(now + offset * 60 * 60 * 1000).toISOString();
    const { data: assignments, error: assignmentError } = await service
      .from('assignments')
      .select('id, title, due_date, course_id, courses(title)')
      .gt('due_date', lower)
      .lte('due_date', upper);
    if (assignmentError) throw assignmentError;

    for (const assignment of assignments ?? []) {
      const { data: enrollments, error: enrollmentError } = await service
        .from('course_enrollments').select('student_id').eq('course_id', assignment.course_id);
      if (enrollmentError) throw enrollmentError;
      const userIds = (enrollments ?? []).map(row => row.student_id);
      if (userIds.length === 0) continue;

      const { data: submissions, error: submissionError } = await service
        .from('assignment_submissions').select('student_id, status, submitted_at')
        .eq('assignment_id', assignment.id).in('student_id', userIds);
      if (submissionError) throw submissionError;
      const completedIds = new Set((submissions ?? [])
        .filter(row => row.submitted_at || row.status === 'submitted' || row.status === 'graded')
        .map(row => row.student_id));

      const { data: preferences, error: preferenceError } = await service
        .from('notification_preferences').select('user_id, assignment_reminders').in('user_id', userIds);
      if (preferenceError) throw preferenceError;
      const optedOutIds = new Set((preferences ?? []).filter(row => !row.assignment_reminders).map(row => row.user_id));
      const recipients = userIds.filter(userId => !completedIds.has(userId) && !optedOutIds.has(userId));
      if (recipients.length === 0) continue;

      const [{ data: profiles, error: profileError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
        service.from('profiles').select('id, full_name, email').in('id', recipients),
        service.from('push_subscriptions').select('user_id, subscription').in('user_id', recipients),
      ]);
      if (profileError) throw profileError;
      if (subscriptionError) throw subscriptionError;
      const subscriptionsByUser = new Map<string, typeof subscriptions>();
      for (const subscription of subscriptions ?? []) {
        const current = subscriptionsByUser.get(subscription.user_id) ?? [];
        subscriptionsByUser.set(subscription.user_id, [...current, subscription]);
      }
      const courseRelation = Array.isArray(assignment.courses) ? assignment.courses[0] : assignment.courses;
      const courseTitle = courseRelation?.title ?? 'your course';

      for (const profile of profiles ?? []) {
        const deliveries: Array<'push' | 'email'> = [];
        if (canPush && (subscriptionsByUser.get(profile.id)?.length ?? 0) > 0) deliveries.push('push');
        if (canEmail && profile.email) deliveries.push('email');
        if (deliveries.length === 0) {
          skipped += 1;
          continue;
        }

        for (const channel of deliveries) {
          const { error: claimError } = await service.from('reminders_sent').insert({
            assignment_id: assignment.id,
            user_id: profile.id,
            reminder_offset: offset,
            channel,
          });
          if (claimError?.code === '23505') {
            skipped += 1;
            continue;
          }
          if (claimError) throw claimError;

          try {
            if (channel === 'push') {
              const payload = JSON.stringify({
                title: `Assignment due in ${offset} hours`,
                body: `${assignment.title} for ${courseTitle} is due soon.`,
                url: '/dashboard/assignments',
              });
              const targets = subscriptionsByUser.get(profile.id) ?? [];
              const results = await Promise.allSettled(targets.map(row => webpush.sendNotification(row.subscription, payload)));
              if (results.every(result => result.status === 'rejected')) throw new Error('Push delivery failed.');
            } else if (resend && env.RESEND_FROM_EMAIL && profile.email) {
              const result = await resend.emails.send({
                from: env.RESEND_FROM_EMAIL,
                to: profile.email,
                subject: `Assignment due in ${offset} hours: ${assignment.title}`,
                text: `${profile.full_name ?? 'Hello'},\n\n${assignment.title} for ${courseTitle} is due in ${offset} hours.\n\nOpen Kings LMS to view the assignment: ${env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/assignments`,
              });
              if (result.error) throw new Error('Email delivery failed.');
            }
            sent += 1;
          } catch (error) {
            failures.push(`${assignment.id}:${profile.id}:${channel}`);
            await service.from('reminders_sent').delete()
              .eq('assignment_id', assignment.id)
              .eq('user_id', profile.id)
              .eq('reminder_offset', offset)
              .eq('channel', channel);
            console.error('[assignment-reminders] delivery failed', { assignmentId: assignment.id, userId: profile.id, channel, error });
          }
        }
      }
    }
  }

  return NextResponse.json({ sent, skipped, failures: failures.length });
}

export const GET = withApiHandler(handleGET, {
  route: '/api/cron/assignment-reminders GET',
  auth: false,
  querySchema: z.object({}).strict(),
});
