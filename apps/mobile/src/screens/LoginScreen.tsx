import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Text, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  const { login, register, forgotPassword } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !phone || !address || !city || !state || !zipCode) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const success = await register({
        email,
        password,
        firstName,
        lastName,
        phone,
        address,
        city,
        state,
        zipCode
      });
      
      if (success) {
        Alert.alert('Success', 'Account created successfully! Welcome to TaskScout.', [
          { text: 'OK', onPress: () => navigation.replace('Dashboard') }
        ]);
      } else {
        Alert.alert('Error', 'Registration failed. Email may already be in use.');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const success = await forgotPassword(email);
      if (success) {
        Alert.alert('Success', 'Password reset instructions have been sent to your email.');
        setMode('login');
      } else {
        Alert.alert('Error', 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <Title style={styles.title}>TaskScout</Title>
      <Paragraph style={styles.subtitle}>
        {mode === 'login' ? 'Sign in to manage your maintenance tickets' : 
         mode === 'register' ? 'Create your residential account' : 
         'Reset your password'}
      </Paragraph>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      
      {mode !== 'forgot' && (
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          autoComplete="password"
        />
      )}

      {mode === 'register' && (
        <>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            label="Street Address"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="City"
            value={city}
            onChangeText={setCity}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="State"
            value={state}
            onChangeText={setState}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="ZIP Code"
            value={zipCode}
            onChangeText={setZipCode}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />
        </>
      )}
      
      <Button
        mode="contained"
        onPress={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Email'}
      </Button>

      <View style={styles.linkContainer}>
        {mode === 'login' && (
          <>
            <Text style={styles.linkText} onPress={() => setMode('forgot')}>
              Forgot your password?
            </Text>
            <Divider style={styles.divider} />
            <Text style={styles.linkText} onPress={() => setMode('register')}>
              Need a residential account? Sign up here
            </Text>
          </>
        )}
        
        {mode === 'register' && (
          <Text style={styles.linkText} onPress={() => setMode('login')}>
            Already have an account? Sign in
          </Text>
        )}
        
        {mode === 'forgot' && (
          <Text style={styles.linkText} onPress={() => setMode('login')}>
            Back to sign in
          </Text>
        )}
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              {renderLoginForm()}
              
              {mode === 'login' && (
                <Paragraph style={styles.demoText}>
                  Demo: root@mail.com / admin
                </Paragraph>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#3B82F6',
    textAlign: 'center',
    paddingVertical: 8,
    textDecorationLine: 'underline',
  },
  divider: {
    width: '100%',
    marginVertical: 8,
  },
  demoText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 16,
  },
});

export default LoginScreen;