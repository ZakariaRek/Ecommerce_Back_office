// src/services/auth.service.ts
import { Auth_URL } from '../lib/apiEndPoints';
import myAxios from "../lib/axios.config";

interface LoginData {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  roles: string[];
}

myAxios.defaults.withCredentials = true;

export async function login(data: LoginData): Promise<LoginResponse | null> {
  try {
    console.log("Login response:", data);

    const res = await myAxios.post(`${Auth_URL}/signin`, data);
    if (res.status === 200 || res.status === 201) {
    console.log("Login :", res.data);
        
      return res.data;
    } else {
      console.log("Error: Status is not 200");
      return null;
    }
  } catch (error) {
    console.error("Error during login:", error);
    
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await myAxios.post(`${Auth_URL}/signout`);
  } catch (error) {
    console.error("Error during logout:", error);
    // We don't throw here because logout should always succeed locally
    // even if the server request fails
  }
}

export async function signup(data: {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}): Promise<{ message: string } | null> {
  try {
    const res = await myAxios.post(`${Auth_URL}/signup`, data);

    if (res.status === 200 || res.status === 201) {
      return res.data;
    } else {
      console.log("Error: Status is not 200");
      return null;
    }
  } catch (error) {
    console.error("Error during signup:", error);
    throw error;
  }
}