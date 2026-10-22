import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useDropzone } from 'react-dropzone';
import { Mail, Briefcase, Image as ImageIcon, Send, AlertCircle, CheckCircle2, Type, Building2, KeyRound } from 'lucide-react';
import { api } from '../services/api';

interface GoogleAuthButtonProps {
  onSuccess: (code: string) => void;
  onError: (error: string) => void;
}

const GoogleAuthButtonInner: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onError }) => {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => onSuccess(codeResponse.code),
    onError: (errorResponse) => onError(errorResponse.error || 'Login failed.'),
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/gmail.send',
  });

  return (
    <button
      onClick={() => login()}
      className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm flex items-center space-x-2 hover:bg-slate-100 transition-all shadow-lg active:scale-95"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
      <span>Sign in with Google</span>
    </button>
  );
};

const GoogleAuthButton: React.FC<GoogleAuthButtonProps & { clientId: string }> = ({ clientId, onSuccess, onError }) => {
  if (!clientId) return null;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleAuthButtonInner onSuccess={onSuccess} onError={onError} />
    </GoogleOAuthProvider>
  );
};

export const AutoApply: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || '').trim();
  });
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [inputType, setInputType] = useState<'image' | 'text'>('image');
  const [jdText, setJdText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCurrentUser()
      .then((user) => {
        if (user?.google_connected) {
          setIsAuthenticated(true);
        }
      })
      .catch((err) => {
        console.warn('Current user check failed:', err);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  const handleGoogleSuccess = async (code: string) => {
    try {
      await api.saveGoogleToken(code);
      setIsAuthenticated(true);
      setError('');
    } catch (err: any) {
      setError(`Backend Error: ${err.message || 'Failed to save token'}`);
    }
  };

  const handleGoogleError = (err: string) => {
    setError(`Google Auth Error: ${err}`);
  };

  const handleSaveCustomClientId = () => {
    const val = customClientIdInput.trim();
    if (val) {
      localStorage.setItem('google_client_id', val);
      setGoogleClientId(val);
      setCustomClientIdInput('');
      setError('');
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxFiles: 1,
  });

  const handleSend = async () => {
    if (!email || !role || !company) {
      setError('Please fill in Target Role, Company, and Recruiter Email.');
      return;
    }
    if (inputType === 'image' && !file) {
      setError('Please upload a screenshot.');
      return;
    }
    if (inputType === 'text' && !jdText.trim()) {
      setError('Please enter the job description text.');
      return;
    }

    setIsSending(true);
    setError('');
    setSuccess(false);

    try {
      if (inputType === 'image') {
        await api.sendAutoApplication({ email, role, company, image: file || undefined });
      } else {
        await api.sendAutoApplication({ email, role, company, text: jdText });
      }
      setSuccess(true);
      setEmail('');
      setRole('');
      setCompany('');
      setFile(null);
      setJdText('');
    } catch (err: any) {
      setError(err.message || 'Failed to send application.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3.5">
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0 mt-0.5 sm:mt-0">
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Auto Apply (Gmail)</h1>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Provide the job posting via screenshot or text. We'll tailor your resume and email the recruiter.
            </p>
          </div>
        </div>
      </div>

      {isCheckingAuth ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 mt-4 text-sm font-medium">Checking connection...</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Mail className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-1.5">Connect Your Gmail Account</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Authorize Truthful AI to send tailored job applications directly from your Gmail address without leaving the browser.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs flex items-start space-x-2.5 max-w-md w-full text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="min-w-0">{error}</p>
            </div>
          )}

          {googleClientId ? (
            <div className="pt-2">
              <GoogleAuthButton
                clientId={googleClientId}
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
              <div className="pt-3">
                <button
                  onClick={() => {
                    localStorage.removeItem('google_client_id');
                    setGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  Change Google Client ID
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 max-w-lg w-full text-left space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Google OAuth Client ID Setup</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                To connect Gmail, provide a Google OAuth 2.0 Web Client ID. You can set <code className="text-brand-400 bg-slate-900 px-1 py-0.5 rounded text-[11px]">VITE_GOOGLE_CLIENT_ID</code> in Vercel settings, or paste it below for this session:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. 123456789-xxx.apps.googleusercontent.com"
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                />
                <button
                  onClick={handleSaveCustomClientId}
                  disabled={!customClientIdInput.trim()}
                  className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all shrink-0"
                >
                  Save & Connect
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Tip: Create a Web application Client ID on <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google Cloud Console</a> with Authorized redirect URIs.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Target Details</h2>
                <span className="flex items-center space-x-1 text-cyan-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gmail Connected</span>
                </span>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Role *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recruiter Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. recruiter@company.com"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="mt-1">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Application generated and sent successfully via your Gmail!</span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={isSending || (!file && inputType === 'image') || (!jdText.trim() && inputType === 'text') || !email || !role || !company}
              className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-[0_4px_16px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_24px_rgba(6,182,212,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing & Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Auto-Application</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Job Description *</h2>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setInputType('image')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-all ${
                    inputType === 'image' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Screenshot</span>
                </button>
                <button
                  onClick={() => setInputType('text')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-all ${
                    inputType === 'text' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>
              </div>
            </div>
            
            {inputType === 'image' ? (
              <div 
                {...getRootProps()} 
                className={`flex-1 min-h-[250px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-lg bg-brand-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <p className="text-xs text-brand-400 mt-2">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Upload Job Posting</p>
                      <p className="text-xs text-slate-400 mt-1">Drag & drop a screenshot, or click to select</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here..."
                className="flex-1 w-full min-h-[250px] p-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
