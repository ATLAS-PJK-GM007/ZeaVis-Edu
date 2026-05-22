import { Elysia } from 'elysia';
import type { DashboardSummary } from '@zeavis/shared';
import { isDiseaseSlug } from '@zeavis/shared';
import { eq, desc, count } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { diseaseCatalog, manualClassifications, diagnoses } from '../db/schema';
import { serviceUnavailable } from '../lib/http-errors';
import { toDisease } from '../lib/disease-mappers';
import { getCurrentUser } from '../lib/auth';
import { loadDiagnosisRecord } from './diagnoses';

export const dashboardRoutes = new Elysia({ prefix: '/api/v1' })
  .get('/dashboard/summary', async ({ request }) => {
    try {
      const db = createDbClient();
      const user = await getCurrentUser(request.headers.get('cookie'));

      const diseases = await db.select().from(diseaseCatalog).orderBy(diseaseCatalog.displayOrder);
      const manualRows = await db.select().from(manualClassifications).orderBy(desc(manualClassifications.createdAt)).limit(1);

      const diagnosisFilters = user ? eq(diagnoses.userId, user.id) : undefined;
      const diagnosisRows = diagnosisFilters
        ? await db.select({ id: diagnoses.id }).from(diagnoses).where(diagnosisFilters).orderBy(desc(diagnoses.createdAt)).limit(1)
        : [];

      const diagnosisCountRows = user
        ? await db.select({ value: count() }).from(diagnoses).where(eq(diagnoses.userId, user.id))
        : [{ value: 0 }];

      const needsReviewRows = user?.role === 'expert'
        ? await db.select({ value: count() }).from(diagnoses).where(eq(diagnoses.status, 'needs_review'))
        : [{ value: 0 }];

      const latestDiagnosis = diagnosisRows[0]
        ? await loadDiagnosisRecord(diagnosisRows[0].id, user?.id ?? null, user?.role === 'expert')
        : null;

      const riskDistribution = diseases.reduce(
        (acc, disease) => {
          if (disease.riskLevel === 'high') acc.high += 1;
          if (disease.riskLevel === 'medium') acc.medium += 1;
          if (disease.riskLevel === 'low') acc.low += 1;
          return acc;
        },
        { low: 0, medium: 0, high: 0 },
      );

      const latestManual = manualRows[0];
      const latestDisease = latestManual && isDiseaseSlug(latestManual.diseaseSlug)
        ? diseases.find((disease) => disease.slug === latestManual.diseaseSlug)
        : null;

      const summary: DashboardSummary = {
        diseaseCount: diseases.length,
        classificationCount: manualRows.length,
        imageClassificationCount: diagnosisCountRows[0]?.value ?? 0,
        needsReviewCount: needsReviewRows[0]?.value ?? 0,
        riskDistribution,
        latestClassification: latestManual && isDiseaseSlug(latestManual.diseaseSlug) && latestDisease ? {
          id: latestManual.id,
          diseaseSlug: latestManual.diseaseSlug,
          observation: latestManual.observation,
          location: latestManual.location,
          createdAt: latestManual.createdAt.toISOString(),
          disease: toDisease(latestDisease),
        } : null,
        latestDiagnosis,
      };

      return summary;
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  });
