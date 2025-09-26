import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Credentials are injected via Vite build-time environment variables.
// Provide them in .env.local for local dev or via your host's environment settings before building.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;


const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const APP_FOLDER_NAME = 'JobApplicationTrackerAI_Resumes';

export const useGoogleAuth = () => {
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeGapiClient = useCallback(() => {
    if (!API_KEY) {
      setError("Google API Key is not configured. Google Drive features will be disabled.");
      console.error("Google API Key is not configured.");
      return;
    }
    window.gapi.load('client', () => {
        window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        }).then(() => {
          setGapiReady(true);
        }).catch((err: any) => {
            console.error("Error initializing GAPI client", err);
            setError("Could not initialize Google Drive API. Please check your Google API Key and ensure the Google Drive API is enabled in your Google Cloud project.");
        });
    });
  }, []);

  const initializeGisClient = useCallback(() => {
    if (!CLIENT_ID) {
        console.error("Google Client ID is not configured. Sign in is disabled.");
        setError("Google Client ID is not configured. Sign in is disabled.");
        return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          window.gapi.client.setToken({ access_token: tokenResponse.access_token });
          setIsSignedIn(true);
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              'Authorization': `Bearer ${tokenResponse.access_token}`
            }
          })
          .then(res => res.json())
          .then(data => setUser(data));
        }
      },
      error_callback: (err: any) => {
        console.error('GIS Error:', err);
        setError("Authentication failed. This is often a configuration issue. Check the browser console and ensure your app's URL is in the 'Authorized JavaScript origins' list in your Google Cloud project's OAuth Client ID settings.");
      }
    });
    setTokenClient(client);
    setGisReady(true);
  }, []);
  
  useEffect(() => {
    const gapiScriptId = 'gapi-script';
    const gsiScriptId = 'gsi-script';

    // Load GAPI script
    let gapiScript = document.getElementById(gapiScriptId) as HTMLScriptElement;
    if (!gapiScript) {
        gapiScript = document.createElement('script');
        gapiScript.id = gapiScriptId;
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = initializeGapiClient;
        document.body.appendChild(gapiScript);
    } else if (window.gapi) {
        initializeGapiClient();
    }
    
    // Load GSI script
    let gsiScript = document.getElementById(gsiScriptId) as HTMLScriptElement;
    if (!gsiScript) {
        gsiScript = document.createElement('script');
        gsiScript.id = gsiScriptId;
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.async = true;
        gsiScript.defer = true;
        gsiScript.onload = initializeGisClient;
        document.body.appendChild(gsiScript);
    } else if (window.google) {
        initializeGisClient();
    }
    
  }, [initializeGapiClient, initializeGisClient]);
  
  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: '' });
    } else {
        setError("Google Sign-In is not yet initialized. Please wait a moment and try again.");
    }
  }, [tokenClient]);

  const signOut = useCallback(() => {
    const token = window.gapi?.client?.getToken();
    if (token !== null && tokenClient) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        setIsSignedIn(false);
        setUser(null);
      });
    } else {
      setIsSignedIn(false);
      setUser(null);
    }
  }, [tokenClient]);
  
  const findOrCreateAppFolder = async (): Promise<string> => {
    const response = await window.gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER_NAME}' and trashed=false`,
        fields: 'files(id)',
    });
    if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id!;
    } else {
        const folderMetadata = {
            name: APP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        };
        const folderResponse = await window.gapi.client.drive.files.create({
            resource: folderMetadata,
            fields: 'id',
        });
        return folderResponse.result.id!;
    }
  };

  const uploadFile = async (file: File): Promise<{id: string; name: string}> => {
    if (!isSignedIn) throw new Error("You must be signed in to upload files.");
    
    const folderId = await findOrCreateAppFolder();
    
    const metadata = {
        name: file.name,
        parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` }),
        body: form,
    });
    
    if(!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.error.message || 'Failed to upload file to Google Drive.');
    }

    const result = await uploadResponse.json();
    return { id: result.id, name: result.name };
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    if (!isSignedIn) throw new Error("You must be signed in to delete files.");
    try {
        await window.gapi.client.drive.files.delete({
            fileId: fileId,
        });
    } catch (err: any) {
        console.error("Failed to delete file from Google Drive:", err);
        throw new Error("Failed to delete file from Google Drive.");
    }
  };

  const isReady = gapiReady && gisReady;
  return { isReady, isSignedIn, user, signIn, signOut, uploadFile, deleteFile, error };
};


