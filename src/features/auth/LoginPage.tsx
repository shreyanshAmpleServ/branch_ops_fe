import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getSavedEmail } from '../../store/useAuthStore';
import { useDesignStore } from '../../store/useDesignStore';
import { Button, Input } from '../../components/ui';

// ─── Shared prop type ─────────────────────────────────────────────────────────
interface LoginFormProps {
  onSubmit: (email: string, password: string, rememberMe: boolean) => void;
  isLoading: boolean;
  error: string | null;
  /** Email pre-filled from "Remember Me" storage */
  savedEmail: string;
}

/* ========= Design 1: Glassmorphism Login ========= */
const LoginDesign1: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error, savedEmail }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 animate-float" style={{ background: 'radial-gradient(circle, #ec4899, transparent)', filter: 'blur(80px)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full opacity-10 animate-float" style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(40px)', animationDelay: '4s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md p-8 rounded-3xl"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white font-display">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.15)' }}>{error}</div>}

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password, rememberMe); }} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                id="rememberMe-d1"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded accent-primary w-4 h-4 cursor-pointer"
              />
              {t('auth.rememberMe')}
            </label>
            <Link to="/forgot-password" className="text-primary hover:underline">{t('auth.forgotPassword')}</Link>
          </div>
          <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading}>{t('auth.login')}</Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {t('auth.noAccount')} <Link to="/register" className="text-primary font-medium hover:underline">{t('auth.signUpHere')}</Link>
        </p>


      </motion.div>
    </div>
  );
};

/* ========= Design 2: Clean Centered Login ========= */
const LoginDesign2: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error, savedEmail }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-3 font-bold text-white text-lg" style={{ background: 'var(--color-primary)' }}>C</div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('auth.loginTitle')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('auth.loginSubtitle')}</p>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {error && <div className="mb-4 p-3 rounded-lg text-sm text-error" style={{ background: 'rgba(239,68,68,0.1)' }}>{error}</div>}
          <form onSubmit={e => { e.preventDefault(); onSubmit(email, password, rememberMe); }} className="space-y-4">
            <Input label={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} type="email" icon={<Mail className="h-4 w-4" />} required />
            <div className="relative">
              <Input label={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} icon={<Lock className="h-4 w-4" />} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 p-1" style={{ color: 'var(--color-text-secondary)' }}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  id="rememberMe-d2"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded accent-primary w-4 h-4 cursor-pointer"
                />
                {t('auth.rememberMe')}
              </label>
              <Link to="/forgot-password" className="text-primary text-xs hover:underline">{t('auth.forgotPassword')}</Link>
            </div>
            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>{t('auth.login')}</Button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>
          {t('auth.noAccount')} <Link to="/register" className="text-primary font-medium hover:underline">{t('auth.signUpHere')}</Link>
        </p>

      </motion.div>
    </div>
  );
};

/* ========= Design 3: Split Screen Login ========= */
const LoginDesign3: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error, savedEmail }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark, #1e1b4b), var(--color-primary))' }}>
        <div className="text-center text-white max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold mx-auto mb-6">S</div>
          <h2 className="text-3xl font-bold font-display mb-4">Sales App</h2>
          <p className="text-lg opacity-80 mb-8">Manage your business relationships with precision and efficiency</p>
          <div className="grid grid-cols-3 gap-4">
            {[{ n: '10K+', l: 'Users' }, { n: '50K+', l: 'Deals' }, { n: '99.9%', l: 'Uptime' }].map(s => (
              <div key={s.l} className="p-3 rounded-xl bg-white/10"><p className="text-xl font-bold">{s.n}</p><p className="text-xs opacity-70">{s.l}</p></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--color-background)' }}>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{t('auth.loginTitle')}</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>{t('auth.loginSubtitle')}</p>

          {error && <div className="mb-4 p-3 rounded-lg text-sm text-error" style={{ background: 'rgba(239,68,68,0.1)' }}>{error}</div>}

          <form onSubmit={e => { e.preventDefault(); onSubmit(email, password, rememberMe); }} className="space-y-4">
            <Input label={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} type="email" icon={<Mail className="h-4 w-4" />} required />
            <div className="relative">
              <Input label={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} icon={<Lock className="h-4 w-4" />} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 p-1" style={{ color: 'var(--color-text-secondary)' }}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  id="rememberMe-d3"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded accent-primary w-4 h-4 cursor-pointer"
                />
                {t('auth.rememberMe')}
              </label>
              <Link to="/forgot-password" className="text-primary text-sm hover:underline">{t('auth.forgotPassword')}</Link>
            </div>
            <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading}>{t('auth.login')}</Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>
            {t('auth.noAccount')} <Link to="/register" className="text-primary font-medium hover:underline">{t('auth.signUpHere')}</Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
};

/* ========= Login Page (Design Switcher) ========= */
export const LoginPage: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Pre-fill email if the user had previously checked "Remember Me"
  const savedEmail = getSavedEmail();

  const handleSubmit = async (email: string, password: string, rememberMe: boolean) => {
    clearError();
    try {
      await login({ email, password, rememberMe });
      navigate('/dashboard');
    } catch {}
  };

  const designs = { design1: LoginDesign1, design2: LoginDesign2, design3: LoginDesign3 };
  const ActiveLogin = designs[activeDesign];

  return <ActiveLogin onSubmit={handleSubmit} isLoading={isLoading} error={error} savedEmail={savedEmail} />;
};
