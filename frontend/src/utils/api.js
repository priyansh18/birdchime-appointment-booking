const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await (contentType?.includes('application/json') 
        ? response.json() 
        : response.text()
      );
    } catch (e) {
      errorData = { message: 'Failed to parse error response' };
    }
    
    const error = new Error(errorData.message || 'Something went wrong');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) return null;
  return contentType?.includes('application/json') 
    ? response.json() 
    : response.text();
}

const api = {
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      credentials: 'include',
      mode: 'cors'
    });
    return handleResponse(response);
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
      credentials: 'include',
      mode: 'cors'
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      credentials: 'include',
      mode: 'cors'
    });
    return handleResponse(response);
  }
};

export default api;
