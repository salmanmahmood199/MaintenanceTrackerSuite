// Debug script to test mobile app connection
const API_URL = 'http://192.168.1.153:5000';

async function testConnection() {
  console.log('Testing connection to:', API_URL);
  
  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();