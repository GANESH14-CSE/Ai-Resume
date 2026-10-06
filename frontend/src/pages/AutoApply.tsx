import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useDropzone } from 'react-dropzone';
import { Mail, Briefcase, Image as ImageIcon, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const AutoApply: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCurrentUser().then((user) => {
      if (user.google_connected) {
        setIsAuthenticated(true);
      }
    }).finally(() => {
      setIsCheckingAuth(false);
    });
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        await api.saveGoogleToken(codeResponse.code);
        setIsAuthenticated(true);
      } catch (err: any) {
        const errorMsg = typeof err === 'string' ? err : (err.message || 'Failed to save token');
        setError(`Backend Error: ${errorMsg}`);
      }
    },
    onError: (errorResponse) => {
      setError(`Google Auth Error: ${errorResponse.error || 'Login failed or was cancelled.'}`);
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/gmail.send'
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxFiles: 1
  });

  const handleSend = async () => {
    if (!email || !role || !file) {
      setError('Please fill in all fields and upload a screenshot.');
      return;
    }
    setIsSending(true);
    setError('');
    setSuccess(false);

    try {
      await api.sendAutoApplication({ email, role, image: file });
      setSuccess(true);
      setEmail('');
      setRole('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to send application.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Auto Apply (Gmail)</h1>
            <p className="text-xs text-slate-400">
              Upload a screenshot of a job posting. We'll extract the JD, tailor your resume, and send an email directly to the recruiter.
            </p>
          </div>
        </div>
      </div>

      {isCheckingAuth ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 text-sm font-medium">Checking connection...</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4">
          <Mail className="w-12 h-12 text-slate-600" />
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Connect Your Gmail Account</h2>
            <p className="text-sm text-slate-400 max-w-md">
              Authorize Truthful AI to send tailored job applications on your behalf directly from your Gmail address.
            </p>
          </div>
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs flex items-start space-x-3 max-w-md w-full text-left">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="mt-1">{error}</p>
            </div>
          )}

          <button
            onClick={() => login()}
            className="px-6 py-3 rounded-lg bg-white text-slate-900 font-bold text-sm flex items-center space-x-2 hover:bg-slate-100 transition-colors mt-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Target Details</h2>
              
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
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Application generated and sent successfully via your Gmail!</span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={isSending || !file || !email || !role}
              className="w-full px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50"
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

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 mb-4">JD Screenshot *</h2>
            
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
          </div>
        </div>
      )}
    </div>
  );
};
