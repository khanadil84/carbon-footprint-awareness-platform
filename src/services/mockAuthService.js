/**
 * Mock Auth Service to simulate API calls.
 * Can be easily replaced with real Axios/fetch calls later.
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  login: async (email, password) => {
    await delay(1000); // Simulate network delay

    // Mock validation
    if (email === 'demo@ecotrack.com' && password === 'Demo@123!') {
      return {
        user: { id: '1', name: 'Demo User', email },
        token: 'mock-jwt-token-xyz'
      };
    }
    
    // Accept any valid-looking login for now, but mock an error for specific test case
    if (password.length < 8) {
      throw new Error('Invalid email or password');
    }

    return {
      user: { id: '2', name: email.split('@')[0], email },
      token: 'mock-jwt-token-abc'
    };
  },

  register: async (name, email) => {
    await delay(1200);
    
    // Simulate checking if user exists
    if (email === 'demo@ecotrack.com') {
      throw new Error('Email is already in use');
    }

    return {
      user: { id: Date.now().toString(), name, email },
      token: 'mock-jwt-token-new'
    };
  },

  resetPassword: async (email) => {
    await delay(1000);
    if (!email) throw new Error('Email is required');
    // Always succeed for mock
    return { success: true, message: 'Password reset link sent' };
  }
};
