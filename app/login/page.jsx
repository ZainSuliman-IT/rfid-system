"use client"
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';

import email_icon from '../components/assets/email.png';
import password_icon from '../components/assets/closeLock.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const router = useRouter();

  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please enter your email address and password.');
      return;
    }

    try {
      const res = await signInWithEmailAndPassword(email, password);
      if (res) {
        console.log("Admin logged in successfully:", res);
        
        setEmail('');
        setPassword('');
        
        router.push('/dashboard'); 
      }
    } catch (e) {
      console.error("Login error:", e);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-xl shadow-gray-100 transition-all">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to access your RFID dashboard</p>
          <span className="w-12 h-1 bg-primary block mx-auto mt-4 rounded-full"></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Image src={email_icon} alt="Email Icon" width={20} height={20} className="opacity-60" />
            <input 
              placeholder="Email Address" 
              className="h-full w-full bg-transparent border-none outline-none text-gray-800 text-sm placeholder-gray-400" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Image src={password_icon} alt="Password Icon" width={20} height={20} className="opacity-60" />
            <input 
              placeholder="Password" 
              className="h-full w-full bg-transparent border-none outline-none text-gray-800 text-sm placeholder-gray-400" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {(validationError || error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
              {validationError || (error?.code === 'auth/invalid-credential' ? 'Invalid email or password' : error?.message)}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 text-center">
            <span className="w-1/4 bg-gray-200 h-[1px] block"></span>
            <p className="text-xs text-gray-500 whitespace-nowrap">
              Do not have an account? {' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
            <span className="w-1/4 bg-gray-200 h-[1px] block"></span>
          </div>

        </form>
      </div>
    </section>
  );
};

export default Login;