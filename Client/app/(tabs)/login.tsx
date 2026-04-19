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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_BASE_URL = 'http:192.168.1.9:8088';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#D9D9D9' }}>
        <View style={styles.whiteBackgroundContainer}>
          <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
            
            <View style={styles.header}>
              <Image 
                source={require('../../assets/images/logoUpBeat.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>

            <View style={styles.formContainer}>
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
                  placeholderTextColor="#999"
                />
                <MaterialCommunityIcons name="email-outline" size={24} color="#555" />
              </View>

              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputStyle}
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={24} 
                    color="#555" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <ThemedText style={styles.buttonText}>Log In</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={onGoToRegister}>
                <ThemedText style={styles.linkText}>Don't have an account?</ThemedText>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  whiteBackgroundContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1, 
  },
  header: {
    height: 150, 
    backgroundColor: '#D9D9D9',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: Platform.OS === 'ios' ? -50 : 0, 
    paddingTop: Platform.OS === 'ios' ? 50 : 0, 
  },
  logo: {
    width: 150, 
    height: 80, 
  },
  formContainer: {
    paddingHorizontal: 30, 
    alignItems: 'center', 
    paddingBottom: 40, 
  },
  title: {
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 25, 
    color: '#000', 
    textAlign: 'center', 
  },
  subtitle: {
    fontSize: 14, 
    color: '#888', 
    marginBottom: 30, 
    textAlign: 'center', 
  },
  label: {
    alignSelf: 'flex-start', 
    fontWeight: '600', 
    marginBottom: 5, 
    fontSize: 14, 
    color: '#333', 
  },
  inputWrapper: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#D9D9D9', 
    opacity: 0.35, 
    borderRadius: 25, 
    paddingHorizontal: 20, 
    marginBottom: 20, 
    height: 55, 
    width: '100%', 
  },
  inputStyle: {
    flex: 1, 
    fontSize: 16, 
    color: '#000', 
    height: '100%', 
  },
  mainButton: {
    backgroundColor: '#2C99FF', 
    width: '100%', 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 30, 
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
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 18, 
  },
  linkText: {
    color: '#9901BF', 
    marginTop: 20, 
    textDecorationLine: 'underline', 
    fontWeight: '500', 
  },
});