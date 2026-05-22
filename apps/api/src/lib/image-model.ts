import * as tf from '@tensorflow/tfjs';
import * as jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { DiseaseSlug, DiseaseLabel, PredictionProbability } from '@zeavis/shared';

const DISEASE_CLASSES: Array<{ slug: DiseaseSlug; label: DiseaseLabel }> = [
  { slug: 'bercak-daun', label: 'Bercak Daun' },
  { slug: 'daun-sehat', label: 'Daun Sehat' },
  { slug: 'karat-daun', label: 'Karat Daun' },
  { slug: 'hawar-daun', label: 'Hawar Daun' },
];

function resolveModelPath() {
  const candidates = [
    resolve(process.cwd(), 'Machine_Learning/model/tfjs_model/model.json'),
    resolve(process.cwd(), '../../Machine_Learning/model/tfjs_model/model.json'),
  ];

  const modelPath = candidates.find((candidate) => existsSync(candidate));
  if (!modelPath) {
    throw new Error('TFJS model file was not found');
  }

  return modelPath;
}

let modelPromise: Promise<tf.GraphModel> | null = null;

async function loadModel(): Promise<tf.GraphModel> {
  if (modelPromise) {
    return modelPromise;
  }

  modelPromise = (async () => {
    try {
      const fileUrl = `file://${resolveModelPath()}`;
      return await tf.loadGraphModel(fileUrl);
    } catch (error) {
      throw new Error(`Failed to load TFJS model: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return modelPromise;
}

export type ClassificationResult = {
  predictedDiseaseSlug: DiseaseSlug;
  confidence: number;
  probabilities: PredictionProbability[];
};

export async function classifyImage(file: File): Promise<ClassificationResult> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('File must be JPEG or PNG');
  }

  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  let imageData: { data: Uint8Array; width: number; height: number };

  if (file.type === 'image/jpeg') {
    const decoded = jpeg.decode(uint8Array, { useTArray: true });
    imageData = {
      data: decoded.data,
      width: decoded.width,
      height: decoded.height,
    };
  } else {
    const png = new PNG();
    await new Promise<void>((resolve, reject) => {
      png.parse(Buffer.from(uint8Array), (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
    imageData = {
      data: png.data,
      width: png.width,
      height: png.height,
    };
  }

  const imageTensor = tf.tidy(() => {
    const rgb = new Uint8Array(imageData.width * imageData.height * 3);
    for (let source = 0, target = 0; source < imageData.data.length; source += 4, target += 3) {
      rgb[target] = imageData.data[source];
      rgb[target + 1] = imageData.data[source + 1];
      rgb[target + 2] = imageData.data[source + 2];
    }

    return tf
      .tensor3d(rgb, [imageData.height, imageData.width, 3], 'int32')
      .resizeBilinear([224, 224])
      .toFloat()
      .expandDims(0);
  });

  try {
    const model = await loadModel();
    const predictions = model.predict(imageTensor) as tf.Tensor;

    try {
      const scoresArray = await predictions.data();

      let maxScore = -Infinity;
      let maxIndex = 0;
      for (let i = 0; i < scoresArray.length; i++) {
        if (scoresArray[i] > maxScore) {
          maxScore = scoresArray[i];
          maxIndex = i;
        }
      }

      const probabilities: PredictionProbability[] = DISEASE_CLASSES.map((disease, index) => ({
        diseaseSlug: disease.slug,
        label: disease.label,
        confidence: Math.max(0, Math.min(1, scoresArray[index])),
      })).sort((a, b) => b.confidence - a.confidence);

      return {
        predictedDiseaseSlug: DISEASE_CLASSES[maxIndex].slug,
        confidence: Math.max(0, Math.min(1, maxScore)),
        probabilities,
      };
    } finally {
      predictions.dispose();
    }
  } finally {
    imageTensor.dispose();
  }
}
