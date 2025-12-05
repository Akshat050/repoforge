export function health(): { status: string; message: string } {
  return { status: 'ok', message: 'healthy' };
}
