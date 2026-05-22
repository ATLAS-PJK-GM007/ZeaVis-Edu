import { Elysia } from 'elysia';
import type { DashboardSummary, RiskLevel } from '@zeavis/shared';
import { createDbClient } from '../db/client';
import { diseaseCatalog, manualClassifications } from '../db/schema';
import { serviceUnavailable } from '../lib/http-errors';
import { desc, eq } from 'drizzle-orm';

export const dashboardRoutes = new Elysia({ prefix: '/api/v1' }).get('/dashboard/summary', async () => {
  try {
    const db = createDbClient();

    const diseaseCount = await db.select().from(diseaseCatalog);
    const classificationCount = await db.select().from(manualClassifications);

    const latestClassificationRow = await db
      .select({
        id: manualClassifications.id,
        diseaseSlug: manualClassifications.diseaseSlug,
        observation: manualClassifications.observation,
        location: manualClassifications.location,
        createdAt: manualClassifications.createdAt,
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
      })
      .from(manualClassifications)
      .innerJoin(diseaseCatalog, eq(manualClassifications.diseaseSlug, diseaseCatalog.slug))
      .orderBy(desc(manualClassifications.createdAt))
      .limit(1);

    const latestClassification = latestClassificationRow[0]
      ? {
          id: latestClassificationRow[0].id,
          diseaseSlug: latestClassificationRow[0].diseaseSlug as any,
          observation: latestClassificationRow[0].observation,
          location: latestClassificationRow[0].location,
          createdAt: latestClassificationRow[0].createdAt.toISOString(),
          disease: {
            slug: latestClassificationRow[0].disease.slug as any,
            label: latestClassificationRow[0].disease.label as any,
            commonName: latestClassificationRow[0].disease.commonName,
            summary: latestClassificationRow[0].disease.summary,
            description: latestClassificationRow[0].disease.description,
            symptoms: latestClassificationRow[0].disease.symptoms,
            recommendations: latestClassificationRow[0].disease.recommendations,
            riskLevel: latestClassificationRow[0].disease.riskLevel as any,
            accentColor: latestClassificationRow[0].disease.accentColor,
            displayOrder: latestClassificationRow[0].disease.displayOrder,
          },
        }
      : null;

    const riskDistributionRows = await db.select().from(diseaseCatalog);
    const riskDistribution: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const row of riskDistributionRows) {
      const risk = row.riskLevel as RiskLevel;
      if (risk in riskDistribution) {
        riskDistribution[risk]++;
      }
    }

    const summary: DashboardSummary = {
      diseaseCount: diseaseCount.length,
      classificationCount: classificationCount.length,
      latestClassification,
      riskDistribution,
    };

    return summary;
  } catch (error) {
    return serviceUnavailable('Database unavailable');
  }
});
