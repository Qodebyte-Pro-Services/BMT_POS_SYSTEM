import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black p-4 md:p-8 lg:p-24 overflow-x-hidden">
     
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-green-400/10 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-green-400/5 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-96 md:h-96 bg-green-400/3 rounded-full blur-2xl md:blur-3xl"></div>
        
       
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        </div>
      </div>

     
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen max-w-7xl mx-auto">
        
       
        <div className="w-full text-center mb-8 md:mb-16">
          <div className="inline-flex items-center justify-center gap-3 md:gap-6 mb-4">
            <div className="hidden sm:block w-1.5 h-8 md:w-2 md:h-12 bg-green-400 rounded-full"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">
              <span className="text-green-400">BIG MEN</span>
              <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-gray-300 mt-1 md:mt-2">
                TRANSACTION APPAREL
              </span>
            </h1>
            <div className="hidden sm:block w-1.5 h-8 md:w-2 md:h-12 bg-green-400 rounded-full"></div>
          </div>
          <p className="text-gray-400 uppercase tracking-[0.3em] text-xs md:text-sm">
            ADMIN COMMAND CENTER
          </p>
        </div>

       
        <div className="w-full max-w-4xl text-center mb-12 md:mb-20 px-4">
          <div className="mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
              Welcome to the
              <span className="block text-green-400 mt-2 md:mt-3">
                <span className="relative">
                  Executive Control
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-400/50"></span>
                </span>
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed max-w-3xl mx-auto">
              Command your fashion empire. Manage premium collections, inventory, 
              customer relationships, and business analytics from one powerful dashboard.
            </p>
          </div>
          
         
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 my-8 md:my-12">
            {[
              { label: "Premium Collections", value: "BMT", icon: "👔" },
              { label: "Inventory Control", value: "100%", icon: "📊" },
              { label: "Real-time Analytics", value: "Live", icon: "📈" },
              { label: "Secure Access", value: "24/7", icon: "🔒" }
            ].map((item, index) => (
              <div 
                key={index} 
                className="text-center p-3 sm:p-4 bg-gray-900/40 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-800 hover:border-green-400/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="text-lg sm:text-xl mb-1">{item.icon}</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-1">{item.value}</div>
                <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-md px-4">
          <Button 
            asChild
            className="group w-full max-w-xs sm:max-w-sm px-6 py-6 sm:px-12 sm:py-6 bg-green-400 hover:bg-green-400 text-black font-bold text-base sm:text-lg rounded-xl hover:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl shadow-green-400/20 h-auto"
          >
            <Link href="/auth/login" className="w-full">
             
              <span className="relative flex items-center justify-center gap-2 sm:gap-3 w-full">
                <span className="text-sm sm:text-base">ENTER ADMIN PORTAL</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </Button>

         
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-gray-400 text-sm">
            <span className="text-xs sm:text-sm">Need administrator access?</span>
            <Link 
              href="/auth/register"
              className="text-green-400 hover:text-green-400 text-sm font-medium hover:underline transition-colors flex items-center gap-1"
            >
              Request Credentials
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        
        <div className="mt-12 md:mt-20 pt-6 md:pt-8 border-t border-gray-800/30 w-full max-w-2xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="text-gray-500 text-xs">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure • Encrypted • Monitored</span>
              </div>
              <p className="text-gray-600">
                All access is logged and monitored for security
              </p>
            </div>
            <div className="text-gray-600 text-xs">
              <p>
                © {new Date().getFullYear()} QodeByte Pro Services.
                <span className="block sm:inline sm:ml-1">All Rights Reserved</span>
              </p>
            </div>
          </div>
        </div>
      </div>

     
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 border border-green-400/20 rounded-full animate-spin-slow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-20 md:h-20 border border-green-400/10 rounded-full"></div>
        </div>
      </div>

      
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black to-transparent pointer-events-none"></div>
    </main>
  );
}