import { Elysia } from 'elysia';
import type { ManualClassificationRequest, ManualClassificationRecord } from '@zeavis/shared';
import { isDiseaseSlug } from '@zeavis/shared';
import { createDbClient } from '../db/client';
import { diseaseCatalog, manualClassifications } from '../db/schema';
import { badRequest, serviceUnavailable } from '../lib/http-errors';
import { desc, eq } from 'drizzle-orm';

export const classificationRoutes = new Elysia({ prefix: '/api/v1' })
  .get('/classifications/manual', async () => {
    try {
      const db = createDbClient();
      const rows = await db
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
        .limit(20);

      const records: ManualClassificationRecord[] = rows.map((row) => ({
        id: row.id,
        diseaseSlug: row.diseaseSlug as any,
        observation: row.observation,
        location: row.location,
        createdAt: row.createdAt.toISOString(),
        disease: {
          slug: row.disease.slug as any,
          label: row.disease.label as any,
          commonName: row.disease.commonName,
          summary: row.disease.summary,
          description: row.disease.description,
          symptoms: row.disease.symptoms,
          recommendations: row.disease.recommendations,
          riskLevel: row.disease.riskLevel as any,
          accentColor: row.disease.accentColor,
          displayOrder: row.disease.displayOrder,
        },
      }));

      return records;
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .post('/classifications/manual', async ({ body }) => {
    const req = body as Partial<ManualClassificationRequest> | undefined;

    if (!req || typeof req !== 'object' || !req.diseaseSlug || !req.observation || !req.location) {
      return badRequest('Missing required fields: diseaseSlug, observation, location');
    }

    if (!isDiseaseSlug(req.diseaseSlug)) {
      return badRequest(`Unknown disease slug: "${req.diseaseSlug}"`);
    }

    try {
      const db = createDbClient();

      const diseaseExists = await db
        .select()
        .from(diseaseCatalog)
        .where(eq(diseaseCatalog.slug, req.diseaseSlug))
        .limit(1);

      if (diseaseExists.length === 0) {
        return badRequest(`Disease with slug "${req.diseaseSlug}" does not exist`);
      }

      const inserted = await db
        .insert(manualClassifications)
        .values({
          diseaseSlug: req.diseaseSlug,
          observation: req.observation,
          location: req.location,
        })
        .returning();

      const disease = diseaseExists[0];
      const record: ManualClassificationRecord = {
        id: inserted[0].id,
        diseaseSlug: inserted[0].diseaseSlug as any,
        observation: inserted[0].observation,
        location: inserted[0].location,
        createdAt: inserted[0].createdAt.toISOString(),
        disease: {
          slug: disease.slug as any,
          label: disease.label as any,
          commonName: disease.commonName,
          summary: disease.summary,
          description: disease.description,
          symptoms: disease.symptoms,
          recommendations: disease.recommendations,
          riskLevel: disease.riskLevel as any,
          accentColor: disease.accentColor,
          displayOrder: disease.displayOrder,
        },
      };

      return record;
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  });
