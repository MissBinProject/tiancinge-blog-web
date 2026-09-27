export function refreshTask(now = Date.now(), payload = {}) {
  const minute = Math.floor(now / 60000);
  return { id: `refresh-${minute}`, scheduleTime: new Date((minute + 1) * 60000).toISOString(), payload };
}
export async function enqueue({ api, project, region, queue, workerUrl, invoker, id, payload = {}, scheduleTime }) {
  const parent = `projects/${project}/locations/${region}/queues/${queue}`;
  try {
    await api(`${parent}/tasks`, { method: 'POST', body: { task: {
      name: `${parent}/tasks/${id}`, ...(scheduleTime ? { scheduleTime } : {}), dispatchDeadline: '180s',
      httpRequest: { httpMethod: 'POST', url: `${workerUrl}/publish`,
        headers: { 'Content-Type': 'application/json' }, body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        oidcToken: { serviceAccountEmail: invoker, audience: workerUrl },
      },
    } } });
    return { queued: true, id };
  } catch (error) {
    if (error.status === 409) return { queued: true, coalesced: true, id };
    throw error;
  }
}
