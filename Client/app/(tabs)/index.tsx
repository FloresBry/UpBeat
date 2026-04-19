import { useEffect, useState } from 'react';
import LandingPage from '../../components/landingPage';
import LoginScreen from './login';
import HomePage from './home';
import {
  ActivityIndicator,
  Alert,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';

type RegisteredUser = {
  id?: number;
  name: string;
  email: string;
};

type AppView = 'landing' | 'register' | 'summary' | 'login' | 'home';

const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8088' : 'http://192.168.100.3:8088';

export default function HomeScreen() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [view, setView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    const prepararApp = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsAppReady(true);
    };
    prepararApp();
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  async function addUser() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing data', 'Please complete name, email and password.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/usuario/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const userId = typeof payload === 'number' ? payload : payload?.id;

      setRegisteredUser({
        id: typeof userId === 'number' ? userId : undefined,
        name: name.trim(),
        email: email.trim(),
      });

      setName('');
      setEmail('');
      setPassword('');
      setView('summary');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Registration error', message);
    } finally {
      setLoading(false);
    }
  }

  if (!isAppReady) {
    return <LandingPage />;
  }

  if (view === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={(user: RegisteredUser) => {
          setCurrentUser(user);
          setView('home');
        }}
        onGoToRegister={() => setView('register')}
      />
    );
  }

  if (view === 'home') {
    return (
      <HomePage
        user={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          setView('landing');
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          {view === 'landing' && (
            <>
              <ThemedText style={styles.title}>Welcome to upBeat</ThemedText>
              <ThemedText style={styles.subtitle}>Choose how you want to continue</ThemedText>

              <TouchableOpacity style={styles.button} onPress={() => setView('register')}>
                <ThemedText style={styles.buttonText}>Register</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('login')}>
                <ThemedText style={styles.secondaryButtonText}>Log In</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {view === 'register' && (
            <>
              <ThemedText style={styles.title}>Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>Register a new user in upBeat</ThemedText>

              <TextInput
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                autoCapitalize="words"
              />

              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={addUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Save and Continue</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('landing')}>
                <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {view === 'summary' && registeredUser && (
            <>
              <ThemedText style={styles.title}>Registered User</ThemedText>
              <ThemedText style={styles.subtitle}>This is the information you just saved</ThemedText>

              <View style={styles.card}>
                {typeof registeredUser.id === 'number' && (
                  <ThemedText style={styles.cardText}>ID: {registeredUser.id}</ThemedText>
                )}
                <ThemedText style={styles.cardText}>Name: {registeredUser.name}</ThemedText>
                <ThemedText style={styles.cardText}>Email: {registeredUser.email}</ThemedText>
              </View>

              <TouchableOpacity style={styles.button} onPress={() => setView('login')}>
                <ThemedText style={styles.buttonText}>Go to Log In</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('register')}>
                <ThemedText style={styles.secondaryButtonText}>Register Another User</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E9EF',
  },
  contentContainer: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.75,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5D8E2',
    padding: 14,
    gap: 8,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D5D8E2',
  },
  button: {
    marginTop: 6,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
