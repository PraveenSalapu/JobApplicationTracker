import React from 'react';
import { SignOutIcon } from './icons';

interface HeaderProps {
  isSignedIn: boolean;
  isApiReady: boolean;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSignedIn, isApiReady, user, onSignIn, onSignOut }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Job Application Tracker AI
          </h1>
          <p className="text-slate-500 mt-1">
            Your personal dashboard for managing job applications.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isSignedIn && user ? (
            <>
              <div className="text-right">
                <p className="font-semibold text-slate-700">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <img src={user.picture} alt="User profile" className="h-12 w-12 rounded-full" />
              <button
                onClick={onSignOut}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                aria-label="Sign Out"
              >
                <SignOutIcon className="h-6 w-6" />
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              disabled={!isApiReady}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isApiReady ? 'Sign in with Google' : 'Initializing...'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};