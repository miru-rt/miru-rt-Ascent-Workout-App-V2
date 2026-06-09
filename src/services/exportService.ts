import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getRecentWorkouts } from '../database/repositories/workoutRepository';
import { getSetsForWorkout } from '../database/repositories/setRepository';
import { getAllExercises } from '../database/repositories/exerciseRepository';

// ─────────────────────────────────────────────────────────────────────────────
// JSON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function exportWorkoutsAsJSON(): Promise<void> {
  const workouts = await getRecentWorkouts(200);
  const exercises = await getAllExercises();

  const exportData = {
    exportedAt: new Date().toISOString(),
    app: 'Ascend Workout Tracker',
    exercises,
    workouts: await Promise.all(
      workouts.map(async (w) => ({
        ...w,
        sets: await getSetsForWorkout(w.id),
      })),
    ),
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = `ascend-export-${Date.now()}.json`;
  const fileUri = `${FileSystem.documentDirectory ?? ''}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Ascend Data',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function exportWorkoutsAsCSV(): Promise<void> {
  const workouts = await getRecentWorkouts(200);
  const exercises = await getAllExercises();
  const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));

  const headers = 'Date,Workout Day,Exercise,Set,Weight (kg),Reps,Volume,Is PR\n';
  const rows: string[] = [];

  for (const workout of workouts) {
    const sets = await getSetsForWorkout(workout.id);
    for (const set of sets) {
      const exName = exerciseMap.get(set.exerciseId) ?? 'Unknown';
      rows.push(
        [
          workout.startedAt.split('T')[0],
          workout.workoutDay,
          `"${exName}"`,
          set.setNumber,
          set.weight,
          set.reps,
          (set.weight * set.reps).toFixed(1),
          set.isPR ? 'Yes' : 'No',
        ].join(','),
      );
    }
  }

  const csv = headers + rows.join('\n');
  const filename = `ascend-export-${Date.now()}.csv`;
  const fileUri = `${FileSystem.documentDirectory ?? ''}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Ascend Data as CSV',
    });
  }
}
