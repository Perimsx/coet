'use client';

import { useState } from 'react';
import Image from 'next/image';
import LoginForm from './login-form';
import { AnimatedCharacters } from '@/features/admin/components/animated-characters';
import siteMetadata from '@/config/site';

export default function LoginView() {
  const [isTyping, setIsTyping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/80 via-white to-blue-50/30 overflow-hidden">
      {/* Decorative vignette edges */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.03)]" />
      
      <div className="relative z-10 flex w-full max-w-[900px] flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-24 animate-view-in pb-12">
        {/* Left Side: Animated Characters (Hidden on mobile for space) */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <AnimatedCharacters 
            isTyping={isTyping} 
            showPassword={showPassword} 
            passwordLength={passwordLength} 
          />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex flex-col items-center md:items-start">
            <div className="mb-8 flex items-center justify-center gap-3">
               <Image 
                 src={siteMetadata.siteLogo} 
                 alt={`${siteMetadata.title} Logo`} 
                 width={36} 
                 height={36} 
                 className="rounded-full shadow-sm"
                 priority
               />
               <span className="text-[20px] font-semibold text-slate-800 tracking-tight">{siteMetadata.title}</span>
            </div>
            
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back!</h1>
              <p className="text-[15px] font-normal text-slate-500">Please enter your details</p>
            </div>
          </div>

          <div className="bg-transparent px-2 sm:px-0">
            <LoginForm 
              setIsTyping={setIsTyping}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              setPasswordLength={setPasswordLength}
            />
          </div>

          <div className="mt-12 text-center md:text-left">
            <a href="/" className="inline-flex items-center text-[13px] text-slate-500 transition-colors hover:text-slate-800 font-medium">
               Back to Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
