import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, User, CircleAlert as AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({
  scheme: Constants.expoConfig?.scheme
});

type ValidationErrors = {
  identifier?: string;
  password?: string;
};

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const router = useRouter();

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!identifier.trim()) {
      errors.identifier = 'Email or nickname is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email/nickname or password';
    }
    if (message.includes('email not confirmed')) {
      return 'Please verify your email address';
    }
    if (message.includes('too many requests')) {
      return 'Too many login attempts. Please try again later';
    }
    if (message.includes('network')) {
      return 'Network error. Please check your connection';
    }
    return 'An unexpected error occurred. Please try again';
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        }
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === 'success') {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (session?.user) {
            // Check if this is the first login
            if (!session.user.user_metadata.has_seen_welcome) {
              await supabase.auth.updateUser({
                data: { has_seen_welcome: true }
              });
              router.replace('/welcome');
            } else {
              router.replace('/(tabs)/');
            }
          }
        }
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError(null);

      // First, try to find the user by nickname
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', identifier)
        .single();

      let email = identifier;

      // If we found a profile with this nickname, get the corresponding user email
      if (profileData?.id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', profileData.id)
          .single();

        if (userError) throw userError;
        if (userData?.email) {
          email = userData.email;
        }
      }
      
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check if this is the first login
      if (!user?.user_metadata.has_seen_welcome) {
        // Update user metadata to mark welcome page as seen
        await supabase.auth.updateUser({
          data: { has_seen_welcome: true }
        });
        
        router.replace('/welcome');
      } else {
        router.replace('/(tabs)/');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800' }}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://raw.githubusercontent.com/stackblitz/webcontainer-core/main/apps/webcontainer-docs/static/img/bolt.svg' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to Tuggi Drive</Text>
          </View>
          <Text style={styles.subtitle}>Sign in with email or nickname</Text>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#ff3b30" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <View style={[
              styles.inputContainer,
              validationErrors.identifier && styles.inputError
            ]}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or Nickname"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setValidationErrors(prev => ({ ...prev, identifier: undefined }));
                  setError(null);
                }}
                autoCapitalize="none"
                autoComplete="username"
                editable={!loading}
              />
            </View>
            {validationErrors.identifier && (
              <Text style={styles.fieldError}>{validationErrors.identifier}</Text>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <View style={[
              styles.inputContainer,
              validationErrors.password && styles.inputError
            ]}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setValidationErrors(prev => ({ ...prev, password: undefined }));
                  setError(null);
                }}
                secureTextEntry
                autoComplete="current-password"
                editable={!loading}
              />
            </View>
            {validationErrors.password && (
              <Text style={styles.fieldError}>{validationErrors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/signup')}
            disabled={loading}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: '#11bd86',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3f3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: '#ff3b30',
    fontSize: 14,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fff3f3',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  fieldError: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#11bd86',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    color: '#11bd86',
    fontWeight: 'bold',
  },
});