import { useEffect, useState } from 'react';
import LandingPage from '../../components/landingPage';
import LoginScreen from './login';
import HomePage from './home';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    const prepararApp = async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setIsAppReady(true);
    };
    prepararApp();
  }, []);

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
        user={currentUser ?? registeredUser}
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
      <ImageBackground
        source={require('../../assets/images/cronoPesas.png')}
        style={styles.authBackground}
        imageStyle={styles.authBackgroundImage}
      >
        <View style={styles.authOverlay}>
          <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
              <View style={styles.panel}>
                {view === 'landing' && (
                  <>
                    <ThemedText style={styles.kicker}>UpBeat Access</ThemedText>
                    <ThemedText style={styles.title}>Welcome to upBeat</ThemedText>
                    <ThemedText style={styles.subtitle}>Sign Up or Log In to continue</ThemedText>

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
                    <ThemedText style={styles.kicker}>Create Account</ThemedText>
                    <ThemedText style={styles.title}>Sign Up</ThemedText>
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

                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('login')}>
                      <ThemedText style={styles.secondaryButtonText}>Go to Log In</ThemedText>
                    </TouchableOpacity>
                  </>
                )}

                {view === 'summary' && registeredUser && (
                  <>
                    <ThemedText style={styles.kicker}>Saved Successfully</ThemedText>
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
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E9EF',
  },
  authBackground: {
    flex: 1,
  },
  authBackgroundImage: {
    opacity: 0.92,
  },
  authOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 18, 28, 0.55)',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  kicker: {
    color: '#2C99FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 6,
    color: '#101828',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 8,
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
    marginTop: 8,
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
