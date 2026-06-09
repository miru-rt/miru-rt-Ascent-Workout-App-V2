import { getDatabase } from '../database';
import { Measurement, ProgressPhoto, DBMeasurement, MeasurementType } from '../../types';
import { nowISO } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// MEASUREMENTS
// ─────────────────────────────────────────────────────────────────────────────

function mapDbToMeasurement(row: DBMeasurement): Measurement {
  return {
    id: row.id,
    type: row.type as MeasurementType,
    value: row.value,
    unit: row.unit,
    measuredAt: row.measured_at,
  };
}

export async function addMeasurement(
  type: MeasurementType,
  value: number,
  unit = 'kg',
): Promise<Measurement> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO measurements (id, type, value, unit, measured_at) VALUES (?, ?, ?, ?, ?)`,
    [id, type, value, unit, now],
  );

  return { id, type, value, unit, measuredAt: now };
}

export async function getMeasurementHistory(
  type: MeasurementType,
  limit = 30,
): Promise<Measurement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBMeasurement>(
    `SELECT * FROM measurements WHERE type = ? ORDER BY measured_at ASC LIMIT ?`,
    [type, limit],
  );
  return rows.map(mapDbToMeasurement);
}

export async function getLatestMeasurement(
  type: MeasurementType,
): Promise<Measurement | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DBMeasurement>(
    `SELECT * FROM measurements WHERE type = ? ORDER BY measured_at DESC LIMIT 1`,
    [type],
  );
  return row ? mapDbToMeasurement(row) : null;
}

export async function getAllLatestMeasurements(): Promise<Partial<Record<MeasurementType, Measurement>>> {
  const types: MeasurementType[] = ['weight', 'waist', 'chest', 'arms', 'thighs', 'hips'];
  const result: Partial<Record<MeasurementType, Measurement>> = {};

  for (const type of types) {
    const measurement = await getLatestMeasurement(type);
    if (measurement) result[type] = measurement;
  }
  return result;
}

export async function deleteMeasurement(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM measurements WHERE id = ?', [id]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS PHOTOS
// ─────────────────────────────────────────────────────────────────────────────

export async function addProgressPhoto(
  uri: string,
  type: 'front' | 'side' | 'back',
  notes: string | null = null,
): Promise<ProgressPhoto> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO progress_photos (id, uri, type, taken_at, notes) VALUES (?, ?, ?, ?, ?)`,
    [id, uri, type, now, notes],
  );

  return { id, uri, type, takenAt: now, notes };
}

export async function getProgressPhotos(
  type?: 'front' | 'side' | 'back',
): Promise<ProgressPhoto[]> {
  const db = await getDatabase();
  const query = type
    ? `SELECT * FROM progress_photos WHERE type = ? ORDER BY taken_at DESC`
    : `SELECT * FROM progress_photos ORDER BY taken_at DESC`;
  const params = type ? [type] : [];

  const rows = await db.getAllAsync<{
    id: string;
    uri: string;
    type: string;
    taken_at: string;
    notes: string | null;
  }>(query, params);

  return rows.map((r) => ({
    id: r.id,
    uri: r.uri,
    type: r.type as 'front' | 'side' | 'back',
    takenAt: r.taken_at,
    notes: r.notes,
  }));
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM progress_photos WHERE id = ?', [id]);
}
