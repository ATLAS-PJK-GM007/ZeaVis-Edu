declare global {
  interface Request {
    metricsStart?: number;
    metricsPath?: string;
  }
}

export {};
