
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">EduHelper <span className="text-indigo-600">Vlaanderen</span></h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Home</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Hoe werkt het?</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Over ons</a>
          </nav>
        </div>
      </header>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} EduHelper Vlaanderen - Voor elke leerling de juiste ondersteuning.</p>
        </div>
      </footer>
    </div>
  );
};
