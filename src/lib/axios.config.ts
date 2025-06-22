import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8099/api';


const myAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
  },
 
});

export default myAxios;