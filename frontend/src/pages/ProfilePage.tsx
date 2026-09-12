import { useState, useRef, useEffect } from 'react';
import { Shield, Camera, LogOut, Lock, KeyRound, CheckCircle2, X, Edit2, Check } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA Setup States
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState<'intro' | 'qr' | 'success'>('intro');
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeData, setQrCodeData] = useState({ secret: '', qrUri: '' });

  // Fetch user details on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.auth.me();
        if (res && res.user) {
          useAuthStore.setState({ user: res.user });
          setName(res.user.name || '');
          setProfileImage(res.user.profileImage || '');
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };

    if (!user || !user.email) {
      fetchUserData();
    } else {
      setName(user.name || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  // 🔹 1. Instant Profile Image Upload & Save on Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfileImage(base64String); // Instant local preview

        // Automatically trigger backend upload
        setLoading(true);
        setFeedback(null);
        try {
          const res = await api.auth.updateProfile({ profileImage: base64String });
          if (res && res.user) {
            useAuthStore.setState({ user: res.user });
            setProfileImage(res.user.profileImage || '');
            setFeedback({ type: 'success', message: 'Profile picture updated successfully!' });
          }
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to upload profile image' });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 2. Direct Name Update
  const handleSaveName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.auth.updateProfile({ name });
      if (res && res.user) {
        useAuthStore.setState({ user: res.user });
        setName(res.user.name || '');
      }
      setFeedback({ type: 'success', message: 'Name updated successfully!' });
      setIsEditingName(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update name' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Password Change Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword?.({ currentPassword, newPassword });
      setFeedback({ type: 'success', message: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle 2FA Setup Initiation
  const handleStart2FA = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.auth.setup2fa();
      setQrCodeData({ secret: res.secret, qrUri: res.qrUri });
      setTwoFaStep('qr');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to initialize 2FA' });
    } finally {
      setLoading(false);
    }
  };

  // 5. Verify 2FA Token
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      await api.auth.verify2fa({ token: totpCode });
      setTwoFaStep('success');
      setTimeout(() => {
        setShow2FaModal(false);
        setTwoFaStep('intro');
        setTotpCode('');
      }, 2000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Invalid verification code. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Your Profile">
      <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/40 border border-zinc-200/80 dark:border-zinc-800/50 overflow-hidden relative">
        
        {/* Feedback Banner */}
        {feedback && (
          <div className={cn(
            "p-4 text-sm font-medium flex items-center justify-between border-b",
            feedback.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          )}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="px-6 md:px-8 pb-8">
          {/* Avatar & Instant Upload Trigger */}
          <div className="flex justify-between items-end -mt-12 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-900 p-1 shadow-md">
                <img src={profileImage || user?.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={name} className="w-full h-full rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800" />
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute inset-1 m-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-sm cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            
            {loading && <span className="text-xs text-indigo-500 font-medium animate-pulse">Updating profile...</span>}
          </div>

          <div className="max-w-2xl space-y-8">
            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Editable Name Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
                  <div className="flex items-center gap-2">
                    {isEditingName ? (
                      <>
                        <input 
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          autoFocus
                        />
                        <button 
                          onClick={handleSaveName}
                          disabled={loading}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm"
                          title="Save Name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setName(user?.name || ''); setIsEditingName(false); }}
                          className="p-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-all"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full px-3 py-2 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{name || user?.name || 'Loading...'}</span>
                        <button 
                          onClick={() => setIsEditingName(true)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          title="Edit Name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 py-2">{user?.email || 'Loading...'}</div>
                  <div className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1"><Shield className="w-3 h-3"/> Verified Account</div>
                </div>
              </div>
            </section>

            <hr className="border-zinc-100 dark:border-zinc-800/60" />
            
            {/* Security Section */}
            <section>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Security Settings</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100"><Lock className="w-4 h-4 text-zinc-400" /> Change Password</span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Update</span>
                </button>
                
                <button 
                  onClick={() => { setShow2FaModal(true); handleStart2FA(); }}
                  className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100"><KeyRound className="w-4 h-4 text-indigo-500" /> Enable Two-Factor Authentication (2FA)</span>
                  <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full font-semibold">Authenticator App</span>
                </button>
              </div>
            </section>
            
            <hr className="border-zinc-100 dark:border-zinc-800/60" />
            
            <section>
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl transition-colors -ml-4"
              >
                <LogOut className="w-4 h-4" />
                Sign out of all devices
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* --- CHANGE PASSWORD MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Current Password</label>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">New Password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Confirm New Password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-md shadow-indigo-500/20">{loading ? 'Updating...' : 'Update Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 2FA AUTHENTICATOR APP MODAL --- */}
      {show2FaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><KeyRound className="w-5 h-5 text-indigo-500"/> Authenticator App 2FA</h3>
              <button onClick={() => setShow2FaModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
            </div>

            {twoFaStep === 'qr' && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-zinc-500">Scan this QR code with Google Authenticator, Authy, or any TOTP app:</p>
                <div className="flex justify-center bg-white p-3 rounded-2xl border inline-block mx-auto shadow-sm">
                  <img src={qrCodeData.qrUri} alt="2FA QR Code" className="w-40 h-40 object-contain" />
                </div>
                <div className="text-xs text-zinc-400">Or enter secret manually: <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-500 font-mono">{qrCodeData.secret}</code></div>
                
                <form onSubmit={handleVerify2FA} className="space-y-3 pt-2">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value)}
                    className="w-full text-center tracking-widest text-xl font-mono px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950 border border-indigo-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button type="submit" disabled={loading || totpCode.length < 6} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-500/20">Verify & Enable</button>
                </form>
              </div>
            )}

            {twoFaStep === 'success' && (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-lg">2FA Enabled Successfully!</h4>
                <p className="text-sm text-zinc-500">Your account is now protected with Authenticator App verification.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}