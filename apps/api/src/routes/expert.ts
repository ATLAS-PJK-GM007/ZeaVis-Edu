import { Elysia } from 'elysia';
import type { ReviewDiagnosisRequest } from '@zeavis/shared';
import { isDiseaseSlug } from '@zeavis/shared';
import { and, desc, eq } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { diagnoses, expertReviews } from '../db/schema';
import { badRequest, forbidden, notFound, serviceUnavailable, unauthorized } from '../lib/http-errors';
import { getCurrentUser } from '../lib/auth';
import { loadDiagnosisRecord } from './diagnoses';

type DiagnosisRecord = Awaited<ReturnType<typeof loadDiagnosisRecord>>;

function isDiagnosisRecordOrNull(record: unknown): record is DiagnosisRecord {
  return record !== null;
}

export const expertRoutes = new Elysia({ prefix: '/api/v1/expert' })
  .get('/reviews', async ({ request }) => {
    const user = await getCurrentUser(request.headers.get('cookie'));
    if (!user) return unauthorized('Authentication required');
    if (user.role !== 'expert') return forbidden('Expert role required');

    try {
      const db = createDbClient();
      const rows = await db
        .select({ id: diagnoses.id })
        .from(diagnoses)
        .where(eq(diagnoses.status, 'needs_review'))
        .orderBy(desc(diagnoses.createdAt))
        .limit(50);

      const records = await Promise.all(rows.map((row) => loadDiagnosisRecord(row.id, null, true)));
      return records.filter(isDiagnosisRecordOrNull);
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .post('/reviews/:diagnosisId', async ({ params, body, request }) => {
    const user = await getCurrentUser(request.headers.get('cookie'));
    if (!user) return unauthorized('Authentication required');
    if (user.role !== 'expert') return forbidden('Expert role required');

    const req = body as Partial<ReviewDiagnosisRequest> | undefined;
    if (!req || (req.verdict !== 'verified' && req.verdict !== 'corrected')) {
      return badRequest('Verdict must be verified or corrected');
    }

    const notes = typeof req.notes === 'string' ? req.notes.trim() : '';
    if (!notes) return badRequest('Review notes are required');

    if (req.verdict === 'corrected') {
      if (!req.correctedDiseaseSlug || !isDiseaseSlug(req.correctedDiseaseSlug)) {
        return badRequest('Corrected disease slug is required for corrected reviews');
      }
    }

    try {
      const db = createDbClient();
      const existing = await db
        .select()
        .from(diagnoses)
        .where(eq(diagnoses.id, params.diagnosisId))
        .limit(1);

      const diagnosis = existing[0];
      if (!diagnosis) return notFound('Diagnosis not found');

      const verdict = req.verdict as 'verified' | 'corrected';
      const correctedSlug = verdict === 'corrected' ? req.correctedDiseaseSlug : null;

      // Wrap update and insert in a transaction for atomicity
      const result = await db.transaction(async (tx) => {
        // Perform conditional update first to determine if this review should proceed
        const updated = await tx
          .update(diagnoses)
          .set({
            status: verdict === 'corrected' ? 'expert_corrected' : 'expert_verified',
            predictedDiseaseSlug: verdict === 'corrected' ? correctedSlug : diagnosis.predictedDiseaseSlug,
            updatedAt: new Date(),
          })
          .where(and(eq(diagnoses.id, diagnosis.id), eq(diagnoses.status, 'needs_review')))
          .returning();

        if (updated.length === 0) {
          throw new Error('DIAGNOSIS_NOT_PENDING_REVIEW');
        }

        // Only insert expert review after successful update
        const reviewValues = {
          diagnosisId: diagnosis.id,
          expertId: user.id,
          verdict,
          correctedDiseaseSlug: correctedSlug,
          notes,
        };
        await tx.insert(expertReviews).values(reviewValues);

        return updated[0];
      });

      return await loadDiagnosisRecord(diagnosis.id, null, true);
    } catch (error) {
      if (error instanceof Error && error.message === 'DIAGNOSIS_NOT_PENDING_REVIEW') {
        return badRequest('Diagnosis is not pending review');
      }
      return serviceUnavailable('Database unavailable');
    }
  });
