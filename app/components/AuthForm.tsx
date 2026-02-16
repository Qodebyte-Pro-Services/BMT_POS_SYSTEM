import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthFormProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthForm({ title, description, children, footer }: AuthFormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-green-400/5 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-green-400/3 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-96 md:h-96 bg-green-400/2 rounded-full blur-2xl md:blur-3xl"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-1 h-6 bg-green-400 rounded-full"></div>
            <Link href="/" className="group">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                <span className="text-green-400 group-hover:text-green-400 transition-colors">BIG MEN</span>
                <span className="block text-sm sm:text-base font-medium text-gray-300 mt-1">
                  TRANSACTION APPAREL
                </span>
              </h1>
            </Link>
            <div className="w-1 h-6 bg-green-400 rounded-full"></div>
          </div>
          <p className="text-gray-400 uppercase tracking-[0.3em] text-xs">
            ADMIN PORTAL
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {title}
              <div className="w-12 h-1 bg-green-400 mx-auto mt-3 rounded-full"></div>
            </h2>
            <p className="text-gray-300 text-sm md:text-base">
              {description}
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-8 pt-6 border-t border-gray-800/50">
              <div className="text-center text-gray-400 text-sm">
                {footer}
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 text-sm transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

      
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-xs">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>  © {new Date().getFullYear()} Powered by QodeByte Pro Services</span>
            <span>Secure • Encrypted • Monitored</span>
          </div>
        </div>
      </div>
    </div>
  );
}