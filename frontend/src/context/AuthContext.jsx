import React from 'react';
import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [token,setToken]=useState(localStorage.getItem('cc_token'));
 const [user,setUser]=useState(null);
 useEffect(()=>{if(token){api.get('/api/auth/me').then(r=>setUser(r.data?.student||r.data)).catch(()=>{localStorage.removeItem('cc_token');setToken(null);setUser(null)});}},[token]);
 const login=async(email,password)=>{const r=await api.post('/api/auth/login',{institute_email:email,password});localStorage.setItem('cc_token',r.data.token);setToken(r.data.token);setUser(r.data.student||r.data.user||null);return r.data;};
 const logout=()=>{localStorage.removeItem('cc_token');setToken(null);setUser(null)};
 return <AuthContext.Provider value={{token,user,setUser,login,logout}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
