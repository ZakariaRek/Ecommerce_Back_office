import { Auth_URL } from './../lib/apiEndPoints';
import myAxios from "../lib/axios.config";
import authHeader from '../lib/authHeaders';

interface user 
{
    username: string;
    password: string;}


export async function Login(data: user ) {
    try {
      const res = await myAxios.get(Auth_URL+`/signin`,data ,authHeader);
  
      if (res.status === 200  || res.status === 201) {
        return res.data;
      } else {
        console.log("Error: Status is not 200");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
          return null;
    }
  }