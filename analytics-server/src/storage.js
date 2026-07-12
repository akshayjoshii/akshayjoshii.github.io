import { mkdir, readdir, appendFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

function dayStamp(isoTimestamp) {
  return isoTimestamp.slice(0, 10);
}

export class JsonlEventStore {
  constructor(dataDir, retentionDays) {
    this.dataDir = dataDir;
    this.retentionDays = retentionDays;
  }

  async init() {
    await mkdir(this.dataDir, { recursive: true });
    await this.cleanup();
  }

  async append(event) {
    const sourceDir = path.join(this.dataDir, event.source);
    await mkdir(sourceDir, { recursive: true });
    const destination = path.join(sourceDir, `${dayStamp(event.receivedAt)}.ndjson`);
    await appendFile(destination, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
  }

  async recent(source, limit = 200) {
    const sourceDir = path.join(this.dataDir, source);
    const files = (await readdir(sourceDir, { withFileTypes: true }).catch(() => []))
      .filter((file) => file.isFile() && /^\d{4}-\d{2}-\d{2}\.ndjson$/.test(file.name))
      .sort((left, right) => right.name.localeCompare(left.name));
    const events = [];

    for (const file of files) {
      const content = await readFile(path.join(sourceDir, file.name), 'utf8');
      const lines = content.trim().split('\n').filter(Boolean).reverse();
      for (const line of lines) {
        try {
          events.push(JSON.parse(line));
        } catch {
          // Skip a malformed historical line rather than breaking the dashboard.
        }
        if (events.length >= limit) return events;
      }
    }
    return events;
  }

  async cleanup(now = new Date()) {
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - this.retentionDays);
    const sourceDirectories = await readdir(this.dataDir, { withFileTypes: true }).catch(() => []);

    await Promise.all(sourceDirectories.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const sourceDir = path.join(this.dataDir, entry.name);
      const files = await readdir(sourceDir, { withFileTypes: true }).catch(() => []);
      await Promise.all(files.filter((file) => file.isFile() && /^\d{4}-\d{2}-\d{2}\.ndjson$/.test(file.name)).map(async (file) => {
        const date = new Date(`${file.name.slice(0, 10)}T00:00:00.000Z`);
        if (date < cutoff) await unlink(path.join(sourceDir, file.name));
      }));
    }));
  }
}
