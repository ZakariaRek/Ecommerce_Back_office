import axios from "axios";

const BASE_URL =  'http://localhost:8099/api';


const myAxios = axios.create({
    baseURL: BASE_URL,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    withCredentials: true, // Enable sending cookies with requests
    timeout: 10000, // 10 second timeout
  });
  
  // Request interceptor
  myAxios.interceptors.request.use(
    (config) => {
      console.log(`Making request to: ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Response interceptor
  myAxios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
      return Promise.reject(error);
    }
  );
  
  export default myAxios;

