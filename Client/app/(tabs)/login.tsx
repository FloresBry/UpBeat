import { useState } from 'react';
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
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8088' : 'http://192.168.100.3:8088';

export default function LoginScreen({ onLoginSuccess, onGoToRegister }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Incomplete data', 'Please fulfill your email and password.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error while logging in.');
      }

      Alert.alert('Welcome!', `Hi again, ${data.user.name}!`);
      if (onLoginSuccess) onLoginSuccess(data.user);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Error.';
      Alert.alert('Login error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ImageBackground
        source={require('../../assets/images/cronoPesas.png')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
              <View style={styles.hero}>
                <Image
                  source={require('../../assets/images/logoUpBeat.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <ThemedText style={styles.heroTitle}>Train smarter</ThemedText>
                <ThemedText style={styles.heroSubtitle}>Sign in to resume your routines</ThemedText>
              </View>

              <View style={styles.formCard}>
                <ThemedText style={styles.title}>Welcome back!</ThemedText>
                <ThemedText style={styles.subtitle}>Ready to move?</ThemedText>

                <ThemedText style={styles.label}>Email</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputStyle}
                    placeholder="example@mail.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                  <MaterialCommunityIcons name="email-outline" size={24} color="#667085" />
                </View>

                <ThemedText style={styles.label}>Password</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputStyle}
                    placeholder="********"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={24}
                      color="#667085"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.mainButton, loading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Log In</ThemedText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onGoToRegister} style={styles.linkButton}>
                  <ThemedText style={styles.linkText}>Don't have an account?</ThemedText>
                </TouchableOpacity>
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
    backgroundColor: '#0B1220',
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.9,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 25, 0.58)',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  logo: {
    width: 170,
    height: 86,
  },
  heroTitle: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#667085',
    marginBottom: 22,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 14,
    color: '#344054',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  inputStyle: {
    flex: 1,
    fontSize: 16,
    color: '#101828',
    height: '100%',
  },
  mainButton: {
    backgroundColor: '#2C99FF',
    width: '100%',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  linkButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#7F56D9',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
});