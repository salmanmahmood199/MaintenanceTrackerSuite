import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

// Simple TaskScout Mobile Demo - Standalone Version
// This is a simplified version that doesn't require complex dependencies

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);

  // Replace with your Replit URL
  const API_BASE_URL = 'https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev';

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setCurrentScreen('dashboard');
        fetchTickets();
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setEmail('');
    setPassword('');
    setTickets([]);
  };

  const LoginScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TaskScout Mobile</Text>
        <Text style={styles.subtitle}>Maintenance Management</Text>
      </View>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => setCurrentScreen('register')}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Register as Residential User
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>Demo Accounts:</Text>
        <Text style={styles.demoText}>Root Admin: root@mail.com / admin</Text>
        <Text style={styles.demoText}>Or register as residential user</Text>
      </View>
    </ScrollView>
  );

  const DashboardScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.firstName || user?.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tickets.length}</Text>
          <Text style={styles.statLabel}>Total Tickets</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {tickets.filter(t => t.status === 'open').length}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        {tickets.slice(0, 5).map((ticket, index) => (
          <View key={index} style={styles.ticketCard}>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketStatus}>Status: {ticket.status}</Text>
            <Text style={styles.ticketPriority}>Priority: {ticket.priority}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setCurrentScreen('create')}
      >
        <Text style={styles.buttonText}>Create New Ticket</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const RegisterScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Residential User Registration</Text>
      </View>
      
      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>Registration Available</Text>
        <Text style={styles.demoText}>
          Full residential registration with address capture is available in the complete mobile app.
        </Text>
        <Text style={styles.demoText}>
          This simplified demo connects to the live API for login testing.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setCurrentScreen('login')}
      >
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const CreateTicketScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Ticket</Text>
      </View>
      
      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>Ticket Creation Available</Text>
        <Text style={styles.demoText}>
          Complete ticket creation with image/video upload is available in the full mobile app.
        </Text>
        <Text style={styles.demoText}>
          Features include mandatory media upload, address selection, and real-time API integration.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setCurrentScreen('dashboard')}
      >
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen />;
      case 'register':
        return <RegisterScreen />;
      case 'create':
        return <CreateTicketScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return renderScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
  demoInfo: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  demoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  logoutButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ticketCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ticketStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ticketPriority: {
    fontSize: 14,
    color: '#666',
  },
});