const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue.join('=') || null;
    }
  }
  return null;
};

const getAuthToken = (): string | null => {
  // Try to get token from cookie first - check multiple possible cookie names
  let tokenFromCookie = getCookie('token') || getCookie('auth-token') || getCookie('userservice');
  
  if (tokenFromCookie) {
    // Decode URL-encoded token and remove extra quotes
    tokenFromCookie = decodeURIComponent(tokenFromCookie);
    
    // Remove surrounding quotes if they exist
    if (tokenFromCookie.startsWith('"') && tokenFromCookie.endsWith('"')) {
      tokenFromCookie = tokenFromCookie.slice(1, -1);
    }
    
    console.log('Token from cookie (cleaned):', tokenFromCookie);
    return tokenFromCookie;
  }
  
  // Fallback to localStorage (if needed)
  try {
    const tokenFromStorage = localStorage.getItem('auth-token');
    console.log('Token from localStorage:', tokenFromStorage);
    return tokenFromStorage;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE"
  };
};
export default getAuthHeaders;
