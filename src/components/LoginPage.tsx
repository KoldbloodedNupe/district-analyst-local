
import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient.ts';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#070a11] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6 border border-indigo-500/20 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">District Analyst</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Strategic Decision Systems</p>
        </div>

        {/* Supabase Auth Component */}
        <div className="auth-container">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1', // Indigo-500
                    brandAccent: '#4f46e5', // Indigo-600
                    brandButtonText: 'white',
                    defaultButtonBackground: '#1e293b', // Slate-800
                    defaultButtonBackgroundHover: '#334155', // Slate-700
                    inputBackground: '#0b0f19', // Slate-950
                    inputBorder: '#1e293b', // Slate-800
                    inputBorderHover: '#6366f1',
                    inputLabelText: '#64748b', // Slate-500
                    inputText: 'white',
                  },
                  fontSizes: {
                    baseInputSize: '13px',
                    baseLabelSize: '11px',
                  },
                  fonts: {
                    bodyFontFamily: `'Inter', sans-serif`,
                    buttonFontFamily: `'Inter', sans-serif`,
                    inputFontFamily: `'Inter', sans-serif`,
                    labelFontFamily: `'Inter', sans-serif`,
                  },
                },
              },
              className: {
                button: 'font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all',
                input: 'rounded-xl border-slate-800 bg-slate-950 text-white font-medium focus:ring-1 focus:ring-indigo-500 transition-all',
                label: 'font-black uppercase tracking-widest text-slate-500 mb-2',
                container: 'space-y-4',
              }
            }}
            providers={[]}
            theme="dark"
          />
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-loose">
          Authorized Personnel Only // v6.2 SYNC<br/>
          &copy; 2025 District Analyst LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
