// Debug script to test mobile app connection
const API_URL = 'http://192.168.1.153:5000';

async function testConnection() {
  console.log('=== Mobile App Connection Debug ===');
  console.log('Testing connection to:', API_URL);
  console.log('Your confirmed IP from ifconfig:', '192.168.1.153');
  
  // Test 1: Basic connectivity
  console.log('\n--- Test 1: Basic API endpoint ---');
  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('✅ Response body:', text);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('❌ This suggests network connectivity issues');
  }

  // Test 2: OPTIONS preflight request
  console.log('\n--- Test 2: CORS Preflight ---');
  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://192.168.1.153:8081',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    
    console.log('✅ CORS preflight status:', response.status);
    console.log('✅ CORS headers:', Object.fromEntries(response.headers.entries()));
    
  } catch (error) {
    console.error('❌ CORS preflight failed:', error.message);
  }

  // Test 3: Login attempt
  console.log('\n--- Test 3: Login attempt ---');
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'placeticket@nsrpetro.com',
        password: 'test123'
      }),
    });
    
    console.log('✅ Login response status:', response.status);
    const text = await response.text();
    console.log('✅ Login response body:', text);
    
  } catch (error) {
    console.error('❌ Login request failed:', error.message);
  }
}

testConnection();