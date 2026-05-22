import { eq } from 'drizzle-orm';
import { createDbClient } from './client';
import { diseaseCatalog, users } from './schema';
import { demoExpertUser, diseaseCatalogRows } from './seed-data';
import { hashPassword } from '../lib/auth';

const db = createDbClient();

await db
  .insert(diseaseCatalog)
  .values(diseaseCatalogRows)
  .onConflictDoUpdate({
    target: diseaseCatalog.slug,
    set: {
      label: diseaseCatalog.label,
      commonName: diseaseCatalog.commonName,
      summary: diseaseCatalog.summary,
      description: diseaseCatalog.description,
      symptoms: diseaseCatalog.symptoms,
      recommendations: diseaseCatalog.recommendations,
      riskLevel: diseaseCatalog.riskLevel,
      accentColor: diseaseCatalog.accentColor,
      displayOrder: diseaseCatalog.displayOrder,
      updatedAt: new Date(),
    },
  });

const passwordHash = await hashPassword(demoExpertUser.password);
const existingExpert = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, demoExpertUser.email))
  .limit(1);

if (existingExpert[0]) {
  await db
    .update(users)
    .set({
      name: demoExpertUser.name,
      role: demoExpertUser.role,
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.email, demoExpertUser.email));
} else {
  await db.insert(users).values({
    email: demoExpertUser.email,
    name: demoExpertUser.name,
    role: demoExpertUser.role,
    passwordHash,
  });
}

console.log(`Seeded ${diseaseCatalogRows.length} disease catalog rows and expert user ${demoExpertUser.email}`);
