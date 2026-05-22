import { Elysia } from 'elysia';
import type { DiseaseCatalogItem, DiseaseSlug, DiseaseLabel, RiskLevel } from '@zeavis/shared';
import { createDbClient } from '../db/client';
import { diseaseCatalog } from '../db/schema';
import { notFound, serviceUnavailable } from '../lib/http-errors';
import { asc, eq } from 'drizzle-orm';

export const diseaseRoutes = new Elysia({ prefix: '/api/v1' })
  .get('/diseases', async () => {
    try {
      const db = createDbClient();
      const rows = await db
        .select()
        .from(diseaseCatalog)
        .orderBy(asc(diseaseCatalog.displayOrder));

      const items: DiseaseCatalogItem[] = rows.map((row) => ({
        slug: row.slug as DiseaseSlug,
        label: row.label as DiseaseLabel,
        commonName: row.commonName,
        summary: row.summary,
        description: row.description,
        symptoms: row.symptoms,
        recommendations: row.recommendations,
        riskLevel: row.riskLevel as RiskLevel,
        accentColor: row.accentColor,
        displayOrder: row.displayOrder,
      }));

      return items;
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .get('/diseases/:slug', async ({ params }) => {
    try {
      const db = createDbClient();
      const row = await db
        .select()
        .from(diseaseCatalog)
        .where(eq(diseaseCatalog.slug, params.slug))
        .limit(1);

      if (row.length === 0) {
        return notFound(`Disease with slug "${params.slug}" not found`);
      }

      const item: DiseaseCatalogItem = {
        slug: row[0].slug as DiseaseSlug,
        label: row[0].label as DiseaseLabel,
        commonName: row[0].commonName,
        summary: row[0].summary,
        description: row[0].description,
        symptoms: row[0].symptoms,
        recommendations: row[0].recommendations,
        riskLevel: row[0].riskLevel as RiskLevel,
        accentColor: row[0].accentColor,
        displayOrder: row[0].displayOrder,
      };

      return item;
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  });
