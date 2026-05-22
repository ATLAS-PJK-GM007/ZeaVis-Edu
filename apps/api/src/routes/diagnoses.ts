import { Elysia } from 'elysia';
import type { DiagnosisPrediction, DiagnosisRecord, ExpertReviewRecord, DiseaseCatalogItem } from '@zeavis/shared';
import { DiagnosisStatus, DiseaseSlug, isDiseaseSlug } from '@zeavis/shared';
import { and, desc, eq } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { diagnoses, diagnosisPredictions, diseaseCatalog, expertReviews, users } from '../db/schema';
import { badGateway, badRequest, notFound, serviceUnavailable, unauthorized } from '../lib/http-errors';
import { getCurrentUser } from '../lib/auth';
import { classifyImage } from '../lib/image-model';
import { uploadImageToStorage } from '../lib/uploader-client';
import { env } from '../config/env';

function toReview(row: any): ExpertReviewRecord | null {
  if (!row.reviewId) return null;

  return {
    id: row.reviewId,
    diagnosisId: row.reviewDiagnosisId,
    expertId: row.reviewExpertId,
    verdict: row.reviewVerdict,
    correctedDiseaseSlug: row.reviewCorrectedDiseaseSlug,
    notes: row.reviewNotes,
    createdAt: row.reviewCreatedAt.toISOString(),
    expert: {
      id: row.expertId,
      email: row.expertEmail,
      name: row.expertName,
      role: 'expert',
    },
  };
}

async function loadDiagnosisRecord(id: string, userId: string | null, expertAccess: boolean): Promise<DiagnosisRecord | null> {
  const db = createDbClient();
  const filters = [eq(diagnoses.id, id)];
  if (!expertAccess && userId) {
    filters.push(eq(diagnoses.userId, userId));
  }

  const rows = await db
    .select({
      id: diagnoses.id,
      userId: diagnoses.userId,
      predictedDiseaseSlug: diagnoses.predictedDiseaseSlug,
      confidence: diagnoses.confidence,
      status: diagnoses.status,
      failureReason: diagnoses.failureReason,
      imageUrl: diagnoses.imageUrl,
      uploaderPublicId: diagnoses.uploaderPublicId,
      imageFileName: diagnoses.imageFileName,
      imageMimeType: diagnoses.imageMimeType,
      imageSizeBytes: diagnoses.imageSizeBytes,
      createdAt: diagnoses.createdAt,
      updatedAt: diagnoses.updatedAt,
      disease: {
        slug: diseaseCatalog.slug,
        label: diseaseCatalog.label,
        commonName: diseaseCatalog.commonName,
        summary: diseaseCatalog.summary,
        description: diseaseCatalog.description,
        symptoms: diseaseCatalog.symptoms,
        recommendations: diseaseCatalog.recommendations,
        riskLevel: diseaseCatalog.riskLevel,
        accentColor: diseaseCatalog.accentColor,
        displayOrder: diseaseCatalog.displayOrder,
      },
      reviewId: expertReviews.id,
      reviewDiagnosisId: expertReviews.diagnosisId,
      reviewExpertId: expertReviews.expertId,
      reviewVerdict: expertReviews.verdict,
      reviewCorrectedDiseaseSlug: expertReviews.correctedDiseaseSlug,
      reviewNotes: expertReviews.notes,
      reviewCreatedAt: expertReviews.createdAt,
      expertId: users.id,
      expertEmail: users.email,
      expertName: users.name,
    })
    .from(diagnoses)
    .leftJoin(diseaseCatalog, eq(diagnoses.predictedDiseaseSlug, diseaseCatalog.slug))
    .leftJoin(expertReviews, eq(expertReviews.diagnosisId, diagnoses.id))
    .leftJoin(users, eq(expertReviews.expertId, users.id))
    .where(and(...filters))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const predictionRows = await db
    .select()
    .from(diagnosisPredictions)
    .where(eq(diagnosisPredictions.diagnosisId, row.id))
    .orderBy(diagnosisPredictions.rank);

  const predictions: DiagnosisPrediction[] = predictionRows.map((prediction) => ({
    id: prediction.id,
    diseaseSlug: prediction.diseaseSlug && isDiseaseSlug(prediction.diseaseSlug) ? prediction.diseaseSlug : null,
    modelLabel: prediction.modelLabel,
    confidence: prediction.confidence,
    rank: prediction.rank,
  }));

  const predictedDiseaseSlug = row.predictedDiseaseSlug && isDiseaseSlug(row.predictedDiseaseSlug) ? row.predictedDiseaseSlug : null;
  const status = row.status as DiagnosisStatus;
  const disease = row.disease && row.disease.slug ? (row.disease as DiseaseCatalogItem) : null;

  return {
    id: row.id,
    userId: row.userId,
    predictedDiseaseSlug,
    confidence: row.confidence,
    status,
    failureReason: row.failureReason,
    imageUrl: row.imageUrl,
    uploaderPublicId: row.uploaderPublicId,
    imageFileName: row.imageFileName,
    imageMimeType: row.imageMimeType,
    imageSizeBytes: row.imageSizeBytes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    disease,
    predictions,
    latestReview: toReview(row),
  };
}

function getFileFromBody(body: unknown): File | null {
  if (body instanceof FormData) {
    const formFile = body.get('file');
    return formFile instanceof File ? formFile : null;
  }

  if (typeof body === 'object' && body !== null) {
    const bodyObj = body as Record<string, unknown>;
    if (bodyObj.file instanceof File) return bodyObj.file;
    if (Array.isArray(bodyObj.file) && bodyObj.file[0] instanceof File) return bodyObj.file[0];
  }

  return null;
}

export const diagnosisRoutes = new Elysia({ prefix: '/api/v1' })
  .post('/diagnoses', async ({ body, request }) => {
    const user = await getCurrentUser(request.headers.get('cookie'));
    if (!user) return unauthorized('Authentication required');

    const file = getFileFromBody(body);
    if (!file) return badRequest('Missing required field: file');
    if (file.size === 0) return badRequest('File is empty');
    if (file.size > env.uploadMaxBytes) return badRequest(`File must be smaller than ${env.uploadMaxBytes} bytes`);
    if (!env.uploadAllowedMimeTypes.includes(file.type)) return badRequest('File type is not allowed');

    let uploaderMetadata;
    try {
      uploaderMetadata = await uploadImageToStorage(file);
    } catch (error) {
      return badGateway(`Upload service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const db = createDbClient();

    try {
      const classification = await classifyImage(file);
      const status = classification.confidence >= 0.7 ? 'ai_verified' : 'needs_review';
      const inserted = await db
        .insert(diagnoses)
        .values({
          userId: user.id,
          predictedDiseaseSlug: classification.predictedDiseaseSlug,
          confidence: classification.confidence,
          status,
          imageUrl: uploaderMetadata.download_url,
          uploaderPublicId: uploaderMetadata.public_id,
          imageFileName: uploaderMetadata.file_name || file.name,
          imageMimeType: uploaderMetadata.mime_type || file.type,
          imageSizeBytes: uploaderMetadata.size_bytes || file.size,
        })
        .returning();

      await db.insert(diagnosisPredictions).values(
        classification.probabilities.map((prediction, index) => ({
          diagnosisId: inserted[0].id,
          diseaseSlug: prediction.diseaseSlug,
          modelLabel: prediction.label,
          confidence: prediction.confidence,
          rank: index + 1,
        })),
      );

      const record = await loadDiagnosisRecord(inserted[0].id, user.id, false);
      if (!record) return serviceUnavailable('Database unavailable');
      return record;
    } catch (error) {
      const inserted = await db
        .insert(diagnoses)
        .values({
          userId: user.id,
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Model inference failed',
          imageUrl: uploaderMetadata.download_url,
          uploaderPublicId: uploaderMetadata.public_id,
          imageFileName: uploaderMetadata.file_name || file.name,
          imageMimeType: uploaderMetadata.mime_type || file.type,
          imageSizeBytes: uploaderMetadata.size_bytes || file.size,
        })
        .returning();

      const record = await loadDiagnosisRecord(inserted[0].id, user.id, false);
      if (!record) return serviceUnavailable('Database unavailable');
      return record;
    }
  })
  .get('/diagnoses', async ({ request }) => {
    const user = await getCurrentUser(request.headers.get('cookie'));
    if (!user) return unauthorized('Authentication required');

    try {
      const db = createDbClient();
      const rows = await db
        .select({ id: diagnoses.id })
        .from(diagnoses)
        .where(eq(diagnoses.userId, user.id))
        .orderBy(desc(diagnoses.createdAt))
        .limit(30);

      const records = await Promise.all(rows.map((row) => loadDiagnosisRecord(row.id, user.id, false)));
      return records.filter(Boolean);
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .get('/diagnoses/:id', async ({ params, request }) => {
    const user = await getCurrentUser(request.headers.get('cookie'));
    if (!user) return unauthorized('Authentication required');

    try {
      const record = await loadDiagnosisRecord(params.id, user.id, user.role === 'expert');
      if (!record) return notFound('Diagnosis not found');
      return record;
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  });

export { loadDiagnosisRecord };
