import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';
import { RootStackParamList } from './types';

import TabNavigator from './TabNavigator';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import ExerciseHistoryScreen from '../screens/ExerciseHistoryScreen';
import WorkoutDayDetailScreen from '../screens/WorkoutDayDetailScreen';
import AddMeasurementScreen from '../screens/AddMeasurementScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: false, // Prevent accidental swipe-down during workout
        }}
      />
      <Stack.Screen
        name="ExerciseHistory"
        component={ExerciseHistoryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WorkoutDayDetail"
        component={WorkoutDayDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AddMeasurement"
        component={AddMeasurementScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
