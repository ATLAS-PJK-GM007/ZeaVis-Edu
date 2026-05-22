import type { DiseaseSlug, DiseaseLabel, PredictionProbability } from '@zeavis/shared';
import { env } from '../config/env';

const DISEASE_CLASSES: Array<{ slug: DiseaseSlug; label: DiseaseLabel }> = [
  { slug: 'bercak-daun', label: 'Bercak Daun' },
  { slug: 'daun-sehat', label: 'Daun Sehat' },
  { slug: 'karat-daun', label: 'Karat Daun' },
  { slug: 'hawar-daun', label: 'Hawar Daun' },
];

const DISEASE_BY_LABEL = new Map<DiseaseLabel, { slug: DiseaseSlug; label: DiseaseLabel }>(
  DISEASE_CLASSES.map((disease) => [disease.label, disease]),
);

type MlPredictionResponse = {
  label: unknown;
  confidence: unknown;
  probabilities: unknown;
};

export type ClassificationResult = {
  predictedDiseaseSlug: DiseaseSlug;
  confidence: number;
  probabilities: PredictionProbability[];
};

function predictUrl() {
  return `${env.mlServiceUrl.replace(/\/+$/, '')}/predict`;
}

function assertKnownLabel(label: unknown): DiseaseLabel {
  if (typeof label !== 'string' || !DISEASE_BY_LABEL.has(label as DiseaseLabel)) {
    throw new Error(`Unknown ML service label: ${String(label)}`);
  }

  return label as DiseaseLabel;
}

function assertConfidence(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ML service confidence for ${label}`);
  }

  return Math.max(0, Math.min(1, value));
}

function mapProbabilities(probabilities: unknown): PredictionProbability[] {
  if (!probabilities || typeof probabilities !== 'object' || Array.isArray(probabilities)) {
    throw new Error('Invalid ML service probabilities');
  }

  return Object.entries(probabilities).map(([label, confidence]) => {
    const knownLabel = assertKnownLabel(label);
    const disease = DISEASE_BY_LABEL.get(knownLabel)!;

    return {
      diseaseSlug: disease.slug,
      label: disease.label,
      confidence: assertConfidence(confidence, disease.label),
    };
  }).sort((a, b) => b.confidence - a.confidence);
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      return String(body.detail);
    }
  } catch {
    return response.statusText || 'Unknown error';
  }

  return response.statusText || 'Unknown error';
}

async function parsePredictionResponse(response: Response): Promise<MlPredictionResponse> {
  try {
    return await response.json() as MlPredictionResponse;
  } catch (error) {
    throw new Error('Invalid ML service JSON response');
  }
}

export async function classifyImage(file: File): Promise<ClassificationResult> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('File must be JPEG or PNG');
  }

  const formData = new FormData();
  formData.append('file', file, file.name || 'leaf-image');

  let response: Response;
  try {
    response = await fetch(predictUrl(), {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw new Error(`ML service request failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(`ML service returned ${response.status}: ${message}`);
  }

  const prediction = await parsePredictionResponse(response);
  const predictedLabel = assertKnownLabel(prediction.label);
  const predictedDisease = DISEASE_BY_LABEL.get(predictedLabel)!;

  return {
    predictedDiseaseSlug: predictedDisease.slug,
    confidence: assertConfidence(prediction.confidence, predictedDisease.label),
    probabilities: mapProbabilities(prediction.probabilities),
  };
}
