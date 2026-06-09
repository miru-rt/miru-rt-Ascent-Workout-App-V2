import { WorkoutDayConfig } from '../types';

export const PROGRAM_ID = 'athletic-physique-v1';

export const PROGRAM_CONFIG = {
  id: PROGRAM_ID,
  name: 'Athletic Physique',
  description: 'Upper-Lower split designed for balanced muscle development and strength. 4 days per week with double-progression loading.',
  phase: 'Hypertrophy',
};

export const WORKOUT_SCHEDULE: Array<{ dayOfWeek: number; workoutDay: string | null; label: string }> = [
  { dayOfWeek: 1, workoutDay: 'Upper A', label: 'Mon' },
  { dayOfWeek: 2, workoutDay: 'Lower A', label: 'Tue' },
  { dayOfWeek: 3, workoutDay: null, label: 'Wed' },
  { dayOfWeek: 4, workoutDay: 'Upper B', label: 'Thu' },
  { dayOfWeek: 5, workoutDay: 'Lower B', label: 'Fri' },
  { dayOfWeek: 6, workoutDay: null, label: 'Sat' },
  { dayOfWeek: 0, workoutDay: null, label: 'Sun' },
];

export const PROGRAM_WORKOUTS: WorkoutDayConfig[] = [
  {
    day: 'Upper A',
    exercises: [
      {
        name: 'Neutral Grip Lat Pulldown',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 32,
        muscleGroup: 'Back',
        equipment: 'Cable Machine',
        instructions:
          'Grip the bar shoulder-width apart with a neutral (palms facing each other) grip. Pull the bar down to your upper chest, leading with your elbows. Squeeze your lats at the bottom. Control the weight on the way up.',
      },
      {
        name: 'Chest Supported Row Machine',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 30,
        muscleGroup: 'Back',
        equipment: 'Machine',
        instructions:
          'Sit facing the pad with your chest supported. Grip the handles and pull back, driving your elbows behind your body. Squeeze your shoulder blades together at the peak. Return under control.',
      },
      {
        name: 'Machine Shoulder Press',
        targetSets: 2,
        repRangeMin: 6,
        repRangeMax: 10,
        startWeight: 12,
        muscleGroup: 'Shoulders',
        equipment: 'Machine or Dumbbells',
        instructions:
          'Set the seat so handles are at shoulder height. Press overhead until arms are nearly locked. Lower under control to starting position. Keep core braced throughout.',
      },
      {
        name: 'Cable Lateral Raise',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 5,
        muscleGroup: 'Shoulders',
        equipment: 'Cable Machine',
        instructions:
          'Stand beside a low cable pulley. Raise your arm out to the side, slightly in front of your body, until parallel with the floor. Lead with your elbow. Lower under control.',
      },
      {
        name: 'Overhead DB Triceps Extension',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 12,
        muscleGroup: 'Arms',
        equipment: 'Dumbbell',
        instructions:
          'Hold a dumbbell with both hands overhead. Hinge at the elbow to lower the weight behind your head. Extend back to the start. Keep elbows pointing forward throughout.',
      },
      {
        name: 'EZ-Bar Curl',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 20,
        muscleGroup: 'Arms',
        equipment: 'EZ-Bar',
        instructions:
          'Grip the EZ-bar at the angled grips. Curl the bar to shoulder height keeping elbows pinned to your sides. Lower under control. Avoid using momentum.',
      },
      {
        name: 'Ab Crunch Machine',
        targetSets: 2,
        repRangeMin: 12,
        repRangeMax: 15,
        startWeight: 32,
        muscleGroup: 'Core',
        equipment: 'Machine',
        instructions:
          'Sit in the machine and hook your feet. Grip the handles and crunch forward, rounding your lower back. Pause at peak contraction. Return under control.',
      },
    ],
  },
  {
    day: 'Lower A',
    exercises: [
      {
        name: 'Leg Press',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 90,
        muscleGroup: 'Legs',
        equipment: 'Machine',
        instructions:
          'Place feet shoulder-width apart on the platform. Lower the weight until knees are at 90 degrees. Press through your heels to full extension, but do not lock knees. Control the descent.',
      },
      {
        name: 'Standing Hip Thrust Machine',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 25,
        muscleGroup: 'Glutes',
        equipment: 'Machine',
        instructions:
          'Stand with the pad across your hips. Push your hips forward explosively. Squeeze glutes at the top. Lower under control. Think about pushing your hips forward, not standing up.',
      },
      {
        name: 'Leg Extension',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 42,
        muscleGroup: 'Legs',
        equipment: 'Machine',
        instructions:
          'Sit with the roller pad against your shins. Extend your legs until straight, squeezing your quads at the top. Lower under control. Avoid using momentum.',
      },
      {
        name: 'Lying Leg Curl',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 20,
        muscleGroup: 'Legs',
        equipment: 'Machine',
        instructions:
          'Lie face down with the roller pad behind your ankles. Curl your legs toward your glutes. Squeeze hamstrings at the top. Lower under control.',
      },
      {
        name: 'Standing Calf Raise',
        targetSets: 2,
        repRangeMin: 12,
        repRangeMax: 15,
        startWeight: 50,
        muscleGroup: 'Legs',
        equipment: 'Machine or Bodyweight',
        instructions:
          'Stand on the edge of a step or calf raise platform. Rise onto the balls of your feet as high as possible. Hold briefly. Lower until you feel a full stretch in your calves.',
      },
      {
        name: 'Back Extension',
        targetSets: 2,
        repRangeMin: 12,
        repRangeMax: 15,
        startWeight: 0,
        muscleGroup: 'Back',
        equipment: 'GHD Machine',
        instructions:
          'Position yourself in the hyperextension machine with hips at the pad. Lower your torso toward the floor. Raise back up until body forms a straight line. Avoid hyperextending.',
      },
    ],
  },
  {
    day: 'Upper B',
    exercises: [
      {
        name: 'Wide Grip Lat Pulldown',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 27,
        muscleGroup: 'Back',
        equipment: 'Cable Machine',
        instructions:
          'Grip the bar wider than shoulder-width with an overhand grip. Pull the bar down to your upper chest leading with elbows. Squeeze lats. Control the return.',
      },
      {
        name: 'Seated Cable Row',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 35,
        muscleGroup: 'Back',
        equipment: 'Cable Machine',
        instructions:
          'Sit at the cable row station with feet on the platform. Row the handle to your lower chest, driving elbows back. Squeeze shoulder blades. Extend forward under control.',
      },
      {
        name: 'Machine Chest Press',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 40,
        muscleGroup: 'Chest',
        equipment: 'Machine',
        instructions:
          'Sit with back flat against the pad. Grip handles at chest level. Press forward until arms are extended. Lower under control. Squeeze chest at full extension.',
      },
      {
        name: 'Reverse Pec Deck',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 25,
        muscleGroup: 'Shoulders',
        equipment: 'Machine',
        instructions:
          'Sit facing the pad. Grip handles at shoulder height. Raise arms out to the sides in a reverse fly motion. Squeeze rear delts at the end range. Return under control.',
      },
      {
        name: 'Cable Lateral Raise',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 5,
        muscleGroup: 'Shoulders',
        equipment: 'Cable Machine',
        instructions:
          'Stand beside a low cable pulley. Raise your arm out to the side until parallel with the floor. Control the descent. Keep a slight bend in the elbow.',
      },
      {
        name: 'EZ Bar Curl',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 20,
        muscleGroup: 'Arms',
        equipment: 'EZ-Bar',
        instructions:
          'Curl the EZ-bar from hips to shoulders keeping elbows tucked. Focus on squeezing the biceps at the top. Lower slowly over 2-3 seconds.',
      },
      {
        name: 'Rope Triceps Pushdown',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 15,
        muscleGroup: 'Arms',
        equipment: 'Cable Machine',
        instructions:
          'Attach a rope to a high pulley. Grip both ends. Push down until arms are fully extended, spreading the rope at the bottom. Control the return.',
      },
    ],
  },
  {
    day: 'Lower B',
    exercises: [
      {
        name: 'Dumbbell Romanian Deadlift',
        targetSets: 2,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 12,
        muscleGroup: 'Legs',
        equipment: 'Dumbbells',
        instructions:
          'Hold dumbbells in front of thighs. Hinge at the hips, pushing them back as you lower the weights along your legs. Feel the hamstring stretch. Drive hips forward to return.',
      },
      {
        name: 'Leg Press',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 90,
        muscleGroup: 'Legs',
        equipment: 'Machine',
        instructions:
          'Higher rep variation. Place feet shoulder-width apart. Lower to 90 degrees. Press through heels. Focus on mind-muscle connection rather than maximum load.',
      },
      {
        name: 'Hip Thrust Machine',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 25,
        muscleGroup: 'Glutes',
        equipment: 'Machine',
        instructions:
          'Push hips forward explosively against resistance. Squeeze glutes hard at full extension. Lower under control. Focus on glute contraction rather than range of motion.',
      },
      {
        name: 'Leg Curl',
        targetSets: 2,
        repRangeMin: 10,
        repRangeMax: 15,
        startWeight: 20,
        muscleGroup: 'Legs',
        equipment: 'Machine',
        instructions:
          'Curl your legs toward your glutes against the resistance. Pause at the top. Control the negative portion. Keep hips down on the pad.',
      },
      {
        name: 'Calf Raise',
        targetSets: 2,
        repRangeMin: 12,
        repRangeMax: 15,
        startWeight: 50,
        muscleGroup: 'Legs',
        equipment: 'Machine or Bodyweight',
        instructions:
          'Rise as high as possible on the balls of your feet. Hold for a full second. Lower slowly for a full calf stretch at the bottom.',
      },
      {
        name: 'Ab Crunch Machine',
        targetSets: 2,
        repRangeMin: 12,
        repRangeMax: 15,
        startWeight: 32,
        muscleGroup: 'Core',
        equipment: 'Machine',
        instructions:
          'Crunch forward against the resistance, rounding through your lower back. Exhale at peak contraction. Return slowly. Focus on the abs, not neck or hip flexors.',
      },
    ],
  },
];
