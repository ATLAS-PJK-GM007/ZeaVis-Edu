export type AppStatus = {
  name: 'ZeaVis Edu';
  status: 'ok';
  version: string;
};

export function createAppStatus(version = '0.1.0'): AppStatus {
  return {
    name: 'ZeaVis Edu',
    status: 'ok',
    version,
  };
}
