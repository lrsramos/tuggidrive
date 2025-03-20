import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'expo-router';
import { User, AtSign, Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileEditorScreen() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    password?: string;
  }>({});

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const validateForm = () => {
    const errors: typeof formErrors = {};
    
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const result = await updateProfile({
        full_name: fullName,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = () => {
    const errors: { password?: string } = {};
    
    if (!passwordForm.currentPassword) {
      errors.password = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.password = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.password = 'New password must be at least 6 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.password = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsSaving(true);
    try {
      // First verify current password
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) throw getUserError;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        setFormErrors(prev => ({
          ...prev,
          password: 'Current password is incorrect'
        }));
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      setIsEditingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      Alert.alert('Success', 'Password updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#11bd86" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load profile'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#11bd86" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.formField}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, formErrors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>
            {formErrors.fullName && (
              <Text style={styles.fieldError}>{formErrors.fullName}</Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Nickname</Text>
            <View style={[styles.inputWrapper, styles.readOnlyInput]}>
              <AtSign size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>
                {profile.nickname || profile.username || 'No nickname set'}
              </Text>
            </View>
            <Text style={styles.helperText}>
              Nickname cannot be changed once set
            </Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, styles.readOnlyInput]}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{profile.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setIsEditingPassword(!isEditingPassword)}
          >
            <Lock size={20} color="#666" />
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </TouchableOpacity>

          {isEditingPassword && (
            <View style={styles.passwordForm}>
              <View style={styles.formField}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={passwordForm.currentPassword}
                    onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                    placeholder="Enter current password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, formErrors.password && styles.inputError]}
                    value={passwordForm.newPassword}
                    onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, formErrors.password && styles.inputError]}
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                    placeholder="Confirm new password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>
                {formErrors.password && (
                  <Text style={styles.fieldError}>{formErrors.password}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.updatePasswordButton, isSaving && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.updatePasswordButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        paddingTop: 60,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#11bd86',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#333',
  },
  readOnlyText: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fff3f3',
  },
  fieldError: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  emailText: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#666',
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  passwordButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  passwordForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  updatePasswordButton: {
    backgroundColor: '#11bd86',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updatePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
  },
});