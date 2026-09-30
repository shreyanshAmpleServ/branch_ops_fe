import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getSavedEmail } from '../../store/useAuthStore';
import { useDesignStore } from '../../store/useDesignStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Button, Input, SmokeyBackground } from '../../components/ui';

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
  const { primaryColor } = useThemeStore();
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* 21st.dev WebGL Interactive Moving Smokey Waves Background */}
      <SmokeyBackground
        color={primaryColor || '#4f46e5'}
        backdropBlurAmount="sm"
        className="absolute inset-0"
      />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm p-7 space-y-5 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary, #4f46e5), #8b5cf6)' }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t('auth.loginTitle') || 'Welcome Back'}
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            {t('auth.loginSubtitle') || 'Sign in to access your dashboard'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-2.5 p-3 rounded-xl text-xs text-rose-200 bg-rose-500/20 border border-rose-500/40 backdrop-blur-md shadow-lg"
          >
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="font-medium leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(email, password, rememberMe);
          }}
          className="space-y-4"
        >
          {/* Email Input */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              {t('auth.email') || 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="name@company.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              {t('auth.password') || 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                id="rememberMe-d1"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              {t('auth.rememberMe') || 'Remember me'}
            </label>
            <Link
              to="/forgot-password"
              className="text-indigo-300 hover:text-white hover:underline transition-colors"
            >
              {t('auth.forgotPassword') || 'Forgot Password?'}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-lg transition-all duration-300 hover:opacity-95 active:scale-98 cursor-pointer disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-primary-dark, #3730a3))',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center">
                {t('auth.login') || 'Sign In'}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-1">
          {t('auth.noAccount') || "Don't have an account?"}{' '}
          <Link to="/register" className="font-semibold text-indigo-300 hover:text-white hover:underline transition-colors">
            {t('auth.signUpHere') || 'Sign Up'}
          </Link>
        </p>
      </motion.div>
    </main>
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
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mb-4 flex items-center gap-2.5 p-3 rounded-xl text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-sm"
            >
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="font-medium leading-relaxed">{error}</span>
            </motion.div>
          )}
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mb-4 flex items-center gap-2.5 p-3 rounded-xl text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-sm"
            >
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="font-medium leading-relaxed">{error}</span>
            </motion.div>
          )}

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
