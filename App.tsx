import React from 'react';
import ApplicationTracker from './components/ApplicationTracker';
import { Header } from './components/Header';
import { useGoogleAuth } from './hooks/useGoogleAuth';

const App: React.FC = () => {
  const {
    isSignedIn,
    user,
    signIn,
    signOut,
    uploadFile,
    deleteFile,
    error: authError,
    isReady: isApiReady,
  } = useGoogleAuth();

  const renderAuthGate = () => (
    <section className="max-w-xl mx-auto bg-white shadow-sm rounded-xl border border-slate-200 p-8 text-center space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Sign in to access your job search workspace</h2>
        <p className="mt-2 text-slate-500">
          Use your Google account to unlock dashboard metrics, stored documents, follow-up reminders, and AI email drafts.
        </p>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={signIn}
          className="px-6 py-3 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in with Google
        </button>
      </div>
      {authError && (
        <p className="text-sm text-left text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {authError}
        </p>
      )}
    </section>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <Header isSignedIn={isSignedIn} user={user} onSignIn={signIn} onSignOut={signOut} isApiReady={isApiReady} />
      <main className="container mx-auto p-4 md:p-8">
        {!isApiReady ? (
          <section className="min-h-[320px] flex flex-col items-center justify-center text-center space-y-3">
            <h2 className="text-xl font-semibold text-slate-700">Connecting to Google Workspace…</h2>
            <p className="text-sm text-slate-500">Loading the Google Drive and Gmail integrations. This only takes a moment.</p>
            {authError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {authError}
              </p>
            )}
          </section>
        ) : isSignedIn ? (
          <ApplicationTracker
            isSignedIn={isSignedIn}
            uploadFile={uploadFile}
            deleteFile={deleteFile}
            authError={authError}
            isApiReady={isApiReady}
          />
        ) : (
          renderAuthGate()
        )}
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Built with React, Tailwind CSS, and Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
