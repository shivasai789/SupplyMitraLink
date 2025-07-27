import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

const TestAuth = () => {
  const [testResult, setTestResult] = useState('');
  const { login, user, token, isAuthenticated } = useAuthStore();

  const testServerConnection = async () => {
    try {
      const response = await fetch('http://localhost:3000/api');
      const data = await response.text();
      setTestResult(`Server Response: ${data}`);
    } catch (error) {
      setTestResult(`Server Error: ${error.message}`);
    }
  };

  const testLogin = async () => {
    try {
      const result = await login('shiva@gmail.com', 'shiva', 'supplier');
      setTestResult(`Login Result: ${JSON.stringify(result, null, 2)}`);
      
      // Check localStorage after login
      setTimeout(() => {
        const authStorage = localStorage.getItem('auth-storage');
        const parsed = JSON.parse(authStorage || '{}');
        setTestResult(prev => prev + `\n\nLocalStorage: ${JSON.stringify(parsed, null, 2)}`);
      }, 100);
    } catch (error) {
      setTestResult(`Login Error: ${error.message}`);
    }
  };

  const checkLocalStorage = () => {
    const authStorage = localStorage.getItem('auth-storage');
    const parsed = JSON.parse(authStorage || '{}');
    setTestResult(`LocalStorage: ${JSON.stringify(parsed, null, 2)}`);
  };

  const checkCurrentState = () => {
    const currentState = useAuthStore.getState();
    setTestResult(`Current State: ${JSON.stringify(currentState, null, 2)}`);
  };

  const clearStorage = () => {
    localStorage.removeItem('auth-storage');
    setTestResult('LocalStorage cleared');
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Auth Debug Panel</h3>
      
      <div className="mb-4 text-sm">
        <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
        <div>Token: {token ? 'Present' : 'Missing'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={testServerConnection}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Server Connection
        </button>
        
        <button 
          onClick={testLogin}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Test Login (shiva@gmail.com)
        </button>
        
        <button 
          onClick={checkLocalStorage}
          className="bg-purple-500 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Check LocalStorage
        </button>

        <button 
          onClick={checkCurrentState}
          className="bg-orange-500 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Check Current State
        </button>

        <button 
          onClick={clearStorage}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Clear Storage
        </button>
      </div>

      {testResult && (
        <div className="mt-4 p-3 bg-white rounded border text-xs">
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default TestAuth; 