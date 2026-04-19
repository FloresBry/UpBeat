import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type User = {
  id?: number;
  name?: string;
  email?: string;
};

type Exercise = {
  id: number;
  name: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  durationMinutes?: number;
};

type Routine = {
  id: number;
  name: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  exercises: Exercise[];
};

type HomePageProps = {
  user?: User | null;
  onLogout: () => void;
};

const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8088' : 'http://192.168.100.3:8088';

const difficultyTheme = {
  EASY: { bg: '#2D07A7', row: '#1F4C9A' },
  MEDIUM: { bg: '#037A0C', row: '#1EBF3A' },
  HARD: { bg: '#A33D00', row: '#B64E14' },
};

const formatClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${h} : ${m} : ${s}`;
};

const inferRoutineDifficulty = (routine?: Routine | null): 'EASY' | 'MEDIUM' | 'HARD' => {
  if (routine?.difficulty) {
    return routine.difficulty;
  }

  if (!routine || routine.exercises.length === 0) {
    return 'EASY';
  }

  if (routine.exercises.some((exercise) => exercise.difficulty === 'HARD')) {
    return 'HARD';
  }

  if (routine.exercises.some((exercise) => exercise.difficulty === 'MEDIUM')) {
    return 'MEDIUM';
  }

  return 'EASY';
};

export default function HomePage({ user, onLogout }: HomePageProps) {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'home' | 'activity' | 'editor'>('home');
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);

  const [newRoutineName, setNewRoutineName] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
  const [exerciseTimerSeconds, setExerciseTimerSeconds] = useState(60);
  const [timerInput, setTimerInput] = useState('60');

  const [isPaused, setIsPaused] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [exerciseElapsed, setExerciseElapsed] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const userId = user?.id ?? 1;

  const currentExercise = selectedRoutine?.exercises[currentExerciseIndex];
  const routineDifficulty = inferRoutineDifficulty(selectedRoutine);
  const theme = difficultyTheme[routineDifficulty];

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([loadExercises(), loadRoutines()]);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (mode !== 'activity' || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTotalElapsed((prev) => prev + 1);
      setExerciseElapsed((prev) => {
        const next = prev + 1;
        if (next >= exerciseTimerSeconds) {
          setCurrentExerciseIndex((idx) => {
            if (!selectedRoutine || selectedRoutine.exercises.length === 0) {
              return 0;
            }
            return (idx + 1) % selectedRoutine.exercises.length;
          });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, isPaused, exerciseTimerSeconds, selectedRoutine]);

  const addableExercises = useMemo(() => {
    if (!selectedRoutine) {
      return [];
    }

    const existingIds = new Set(selectedRoutine.exercises.map((exercise) => exercise.id));
    return availableExercises.filter((exercise) => !existingIds.has(exercise.id));
  }, [availableExercises, selectedRoutine]);

  async function loadExercises() {
    try {
      const response = await fetch(`${API_BASE_URL}/exercises`);
      if (!response.ok) {
        throw new Error(`Unable to load exercises (${response.status})`);
      }
      const payload = await response.json();
      setAvailableExercises(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  async function loadRoutines() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/routines`);
      if (!response.ok) {
        throw new Error(`Unable to load routines (${response.status})`);
      }
      const payload = await response.json();
      setRoutines(
        payload.map((routine: { id: number; name: string; difficulty?: 'EASY' | 'MEDIUM' | 'HARD' }) => ({
          ...routine,
          exercises: [],
        }))
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  async function openRoutine(routineId: number, nextMode: 'activity' | 'editor') {
    try {
      const response = await fetch(`${API_BASE_URL}/routines/${routineId}`);
      if (!response.ok) {
        throw new Error(`Unable to open routine (${response.status})`);
      }

      const routine = await response.json();
      setSelectedRoutine(routine);
      setCurrentExerciseIndex(0);
      setExerciseElapsed(0);
      setTotalElapsed(0);
      setMode(nextMode);
      setIsPaused(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  async function createRoutine() {
    if (!newRoutineName.trim()) {
      Alert.alert('Missing name', 'Write a name for your routine.');
      return;
    }

    if (selectedExerciseIds.length === 0) {
      Alert.alert('Missing exercises', 'Select at least one exercise.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newRoutineName.trim(),
          exerciseIds: selectedExerciseIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Unable to create routine (${response.status})`);
      }

      setCreateModalVisible(false);
      setNewRoutineName('');
      setSelectedExerciseIds([]);
      await loadRoutines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  async function confirmDeleteRoutine() {
    if (!selectedRoutine) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/routines/${selectedRoutine.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Unable to delete routine (${response.status})`);
      }

      setDeleteModalVisible(false);
      setSelectedRoutine(null);
      setMode('home');
      await loadRoutines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  async function removeExercise(exerciseId: number) {
    if (!selectedRoutine) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/routines/${selectedRoutine.id}/exercises/${exerciseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Unable to remove exercise (${response.status})`);
      }

      const routine = await response.json();
      setSelectedRoutine(routine);
      setCurrentExerciseIndex(0);
      await loadRoutines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  async function addExercise(exerciseId: number) {
    if (!selectedRoutine) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/routines/${selectedRoutine.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      });

      if (!response.ok) {
        throw new Error(`Unable to add exercise (${response.status})`);
      }

      const routine = await response.json();
      setSelectedRoutine(routine);
      setAddExerciseModalVisible(false);
      await loadRoutines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  }

  function applyTimerValue() {
    const parsedValue = Number(timerInput);
    if (!Number.isFinite(parsedValue) || parsedValue < 10) {
      Alert.alert('Invalid value', 'Use at least 10 seconds per exercise.');
      return;
    }

    setExerciseTimerSeconds(parsedValue);
    setExerciseElapsed(0);
    setTimerModalVisible(false);
  }

  if (mode === 'activity' && selectedRoutine) {
    return (
      <SafeAreaView style={[styles.activityContainer, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={styles.activityScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.activitySurface, { width: Math.min(width - 28, 430) }]}>
            <View style={styles.activityHeader}>
              <TouchableOpacity onPress={() => setMode('home')}>
                <MaterialCommunityIcons name="home-outline" size={28} color="#062f1f" />
              </TouchableOpacity>

              <ThemedText style={styles.activityTitle}>{selectedRoutine.name}</ThemedText>

              <TouchableOpacity onPress={() => setMode('editor')}>
                <MaterialCommunityIcons name="menu" size={28} color="#062f1f" />
              </TouchableOpacity>
            </View>

            <View style={styles.exerciseCard}>
              <Image source={require('../../assets/images/defaultAvatar.jpg')} style={styles.exerciseImage} />
            </View>

            <ThemedText style={styles.exerciseName}>{currentExercise?.name ?? 'Sin ejercicio'}</ThemedText>
            <ThemedText style={styles.timerSmall}>{formatClock(exerciseElapsed)}</ThemedText>
            <ThemedText style={styles.timerMain}>{formatClock(totalElapsed)}</ThemedText>

            <View style={styles.bottomActions}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
                <MaterialCommunityIcons name="trash-can" size={32} color="#ff1f1f" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pauseButton}
                onPress={() => setIsPaused((prev) => !prev)}
              >
                <MaterialCommunityIcons
                  name={isPaused ? 'play' : 'pause'}
                  size={28}
                  color="#ffffff"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setTimerModalVisible(true)}>
                <MaterialCommunityIcons name="cog-outline" size={32} color="#0b2416" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal transparent visible={deleteModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalCard}>
              <ThemedText style={styles.confirmTitle}>Estas seguro de terminar la rutina ?</ThemedText>
              <View style={styles.confirmButtonsRow}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmBack]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <ThemedText style={styles.confirmButtonText}>Regresar</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmDelete]}
                  onPress={confirmDeleteRoutine}
                >
                  <ThemedText style={styles.confirmButtonText}>Terminar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={timerModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText style={styles.modalTitle}>Configurar cronometro por ejercicio (segundos)</ThemedText>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={timerInput}
                onChangeText={setTimerInput}
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setTimerModalVisible(false)}>
                  <ThemedText style={styles.modalSecondaryText}>Cancelar</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={applyTimerValue}>
                  <ThemedText style={styles.modalPrimaryText}>Guardar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (mode === 'editor' && selectedRoutine) {
    return (
      <SafeAreaView style={styles.editorContainer}>
        <View style={styles.editorShell}>
          <View style={[styles.editorCard, { width: Math.min(width - 28, 430) }]}>
            <View style={styles.editorHeader}>
              <TouchableOpacity onPress={() => setMode('activity')}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#2b2b2b" />
              </TouchableOpacity>
              <ThemedText style={styles.editorTitle}>Lista de Actividades</ThemedText>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.editorList} showsVerticalScrollIndicator={false}>
              {selectedRoutine.exercises.map((exercise, index) => {
                const rowColor = index % 2 === 0 ? '#C53030' : '#204D91';
                const thumbnail = require('../../assets/images/defaultAvatar.jpg');
                return (
                  <View key={exercise.id} style={[styles.exerciseRow, { backgroundColor: rowColor }]}>
                    <Image source={thumbnail} style={styles.exerciseThumb} />
                    <ThemedText style={styles.exerciseRowText}>{exercise.name}</ThemedText>
                    <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                      <MaterialCommunityIcons name="trash-can" size={28} color="#ff1f1f" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setAddExerciseModalVisible(true)}
              >
                <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
                <ThemedText style={styles.addExerciseButtonText}>Agregar ejercicio</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        <Modal transparent visible={addExerciseModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText style={styles.modalTitle}>Selecciona un ejercicio para agregar</ThemedText>
              <ScrollView style={{ maxHeight: 250 }}>
                {addableExercises.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    style={styles.selectableExerciseRow}
                    onPress={() => addExercise(exercise.id)}
                  >
                    <ThemedText style={styles.selectableExerciseText}>{exercise.name}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setAddExerciseModalVisible(false)}
              >
                <ThemedText style={styles.modalSecondaryText}>Cerrar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Bienvenido, {user?.name || 'Atleta'}</ThemedText>
        <ThemedText style={styles.subtitle}>Tus rutinas para entrenar hoy</ThemedText>

        <TouchableOpacity style={styles.createButton} onPress={() => setCreateModalVisible(true)}>
          <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
          <ThemedText style={styles.createButtonText}>Crear nueva rutina</ThemedText>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.routineList}>
          {routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View>
                <ThemedText style={styles.routineName}>{routine.name}</ThemedText>
                <ThemedText style={styles.routineMeta}>Ejercicios: {routine.exercises.length || 'cargando'}</ThemedText>
                  <ThemedText style={styles.routineDifficulty}>
                    Dificultad: {routine.difficulty ?? 'EASY'}
                  </ThemedText>
              </View>

              <View style={styles.routineActions}>
                <TouchableOpacity
                  style={styles.routineStartButton}
                  onPress={() => openRoutine(routine.id, 'activity')}
                >
                  <ThemedText style={styles.routineStartText}>Iniciar</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.routineEditButton}
                  onPress={() => openRoutine(routine.id, 'editor')}
                >
                  <ThemedText style={styles.routineEditText}>Editar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <ThemedText style={styles.logoutText}>Cerrar sesion</ThemedText>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={createModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Crear rutina</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de rutina"
              value={newRoutineName}
              onChangeText={setNewRoutineName}
            />

            <ThemedText style={styles.modalSubtitle}>Selecciona ejercicios</ThemedText>
            <ScrollView style={{ maxHeight: 220 }}>
              {availableExercises.map((exercise) => {
                const selected = selectedExerciseIds.includes(exercise.id);
                return (
                  <Pressable
                    key={exercise.id}
                    style={[styles.selectableExerciseRow, selected && styles.selectableExerciseRowSelected]}
                    onPress={() => {
                      setSelectedExerciseIds((prev) => {
                        if (prev.includes(exercise.id)) {
                          return prev.filter((id) => id !== exercise.id);
                        }
                        return [...prev, exercise.id];
                      });
                    }}
                  >
                    <ThemedText style={styles.selectableExerciseText}>{exercise.name}</ThemedText>
                    {selected && <MaterialCommunityIcons name="check-circle" size={20} color="#2C99FF" />}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <ThemedText style={styles.modalSecondaryText}>Cancelar</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalPrimaryButton} onPress={createRoutine}>
                <ThemedText style={styles.modalPrimaryText}>Crear</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2C99FF',
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  routineList: {
    gap: 12,
    paddingBottom: 16,
  },
  routineCard: {
    backgroundColor: '#EAEAEA',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineName: {
    color: '#111',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  routineMeta: {
    color: '#666',
    fontSize: 13,
  },
  routineDifficulty: {
    color: '#333',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  routineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  routineStartButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routineStartText: {
    color: '#fff',
    fontWeight: '700',
  },
  routineEditButton: {
    backgroundColor: '#343A40',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routineEditText: {
    color: '#fff',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#FF4B4B',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  modalTitle: {
    color: '#1d1d1d',
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#333',
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    color: '#111',
  },
  selectableExerciseRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectableExerciseRowSelected: {
    borderColor: '#2C99FF',
    backgroundColor: '#eef6ff',
  },
  selectableExerciseText: {
    color: '#111',
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalSecondaryButton: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: '#333',
    fontWeight: '700',
  },
  modalPrimaryButton: {
    backgroundColor: '#2C99FF',
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  activityContainer: {
    flex: 1,
    paddingHorizontal: 22,
  },
  activityScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  activitySurface: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  activityHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  exerciseCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
    alignItems: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
  },
  exerciseName: {
    marginTop: 14,
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  timerSmall: {
    marginTop: 8,
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  timerMain: {
    marginTop: 8,
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
  },
  bottomActions: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pauseButton: {
    backgroundColor: '#ef3f3f',
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCard: {
    width: '88%',
    backgroundColor: '#f0f0f0',
    borderRadius: 26,
    padding: 24,
    gap: 20,
  },
  confirmTitle: {
    color: '#222',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    textAlign: 'center',
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    minHeight: 52,
    minWidth: 110,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBack: {
    backgroundColor: '#4e5561',
  },
  confirmDelete: {
    backgroundColor: '#db3b3b',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#666466',
    paddingHorizontal: 14,
  },
  editorShell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  editorCard: {
    flex: 1,
    maxHeight: '96%',
    borderRadius: 28,
    backgroundColor: 'rgba(105,105,105,0.86)',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 16,
  },
  editorHeader: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  editorList: {
    paddingBottom: 18,
    gap: 10,
  },
  exerciseRow: {
    minHeight: 76,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  exerciseRowText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    flex: 1,
  },
  addExerciseButton: {
    marginTop: 12,
    backgroundColor: '#1f7a2e',
    borderRadius: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addExerciseButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});