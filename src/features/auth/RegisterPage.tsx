import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { useThemeStore } from '../../store/useThemeStore';
import { SmokeyBackground } from '../../components/ui';
import api from '../../lib/api';

// ─── Shared Register Form Data ───────────────────────────────────────────────
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface RegisterDesignProps {
  form: RegisterFormData;
  update: (k: keyof RegisterFormData, v: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
}

/* ========= Design 1: Glassmorphism Register ========= */
const RegisterDesign1: React.FC<RegisterDesignProps> = ({
  form,
  update,
  onSubmit,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useThemeStore();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  return (
    <main className="relative w-screen h-screen min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* 21st.dev WebGL Moving Smokey Waves Background */}
      <SmokeyBackground
        color={primaryColor || '#4f46e5'}
        backdropBlurAmount="sm"
        className="absolute inset-0"
      />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-7 space-y-4 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-2.5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary, #4f46e5), #8b5cf6)' }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t('auth.registerTitle') || 'Create Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            {t('auth.registerSubtitle') || 'Start managing your business efficiently'}
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-200">
                {t('auth.firstName') || 'First Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  type="text"
                  placeholder="John"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-200">
                {t('auth.lastName') || 'Last Name'}
              </label>
              <div className="relative">
                <input
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  type="text"
                  placeholder="Doe"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              {t('auth.email') || 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                type="email"
                placeholder="name@company.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              {t('auth.password') || 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              {t('auth.confirmPassword') || 'Confirm Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-400/70 bg-white/5 border border-white/15 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="flex items-start gap-2 pt-1 text-xs">
            <input
              type="checkbox"
              id="agreeToTerms-d1"
              checked={form.agreeToTerms}
              onChange={(e) => update('agreeToTerms', e.target.checked)}
              required
              className="rounded accent-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
            />
            <label htmlFor="agreeToTerms-d1" className="text-slate-300 hover:text-white cursor-pointer select-none leading-relaxed transition-colors">
              {t('auth.agreeToTerms') || 'I agree to the Terms of Service and Privacy Policy'}
            </label>
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
                Creating account...
              </span>
            ) : (
              <span className="flex items-center">
                {t('auth.register') || 'Create Account'}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 pt-1">
          {t('auth.hasAccount') || 'Already have an account?'}{' '}
          <Link to="/login" className="font-semibold text-indigo-300 hover:text-white hover:underline transition-colors">
            {t('auth.signInHere') || 'Sign in here'}
          </Link>
        </p>
      </motion.div>
    </main>
  );
};

/* ========= Design 2: Clean Centered Register ========= */
const RegisterDesign2: React.FC<RegisterDesignProps> = ({
  form,
  update,
  onSubmit,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-3 font-bold text-white text-lg shadow-md" style={{ background: 'var(--color-primary)' }}>
            C
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {t('auth.registerTitle') || 'Create Account'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {t('auth.registerSubtitle') || 'Start managing your business efficiently'}
          </p>
        </div>

        <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
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

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.firstName') || 'First Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    type="text"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.lastName') || 'Last Name'}
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('auth.email') || 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  type="email"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('auth.password') || 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('auth.confirmPassword') || 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms-d2"
                checked={form.agreeToTerms}
                onChange={(e) => update('agreeToTerms', e.target.checked)}
                required
                className="rounded accent-primary w-4 h-4 mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms-d2" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed">
                {t('auth.agreeToTerms') || 'I agree to the Terms of Service and Privacy Policy'}
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition shadow-sm hover:opacity-95 active:scale-98 cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-primary)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                t('auth.register') || 'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>
          {t('auth.hasAccount') || 'Already have an account?'}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.signInHere') || 'Sign in here'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

/* ========= Design 3: Split Screen Register ========= */
const RegisterDesign3: React.FC<RegisterDesignProps> = ({
  form,
  update,
  onSubmit,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark, #1e1b4b), var(--color-primary))' }}>
        <div className="text-center text-white max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-xl">
            S
          </div>
          <h2 className="text-3xl font-bold font-display mb-4">Join Sales App</h2>
          <p className="text-lg opacity-85 mb-8">Start your journey to precision and efficiency in customer relationship management</p>
          <div className="grid grid-cols-3 gap-4">
            {[{ n: '10K+', l: 'Users' }, { n: '50K+', l: 'Deals' }, { n: '99.9%', l: 'Uptime' }].map((s) => (
              <div key={s.l} className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-xl font-bold">{s.n}</p>
                <p className="text-xs opacity-75">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--color-background)' }}>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {t('auth.registerTitle') || 'Create Account'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {t('auth.registerSubtitle') || 'Start managing your business efficiently'}
          </p>

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

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.firstName') || 'First Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    type="text"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.lastName') || 'Last Name'}
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('auth.email') || 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  type="email"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('auth.password') || 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('auth.confirmPassword') || 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms-d3"
                checked={form.agreeToTerms}
                onChange={(e) => update('agreeToTerms', e.target.checked)}
                required
                className="rounded accent-primary w-4 h-4 mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms-d3" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed">
                {t('auth.agreeToTerms') || 'I agree to the Terms of Service and Privacy Policy'}
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition shadow-sm hover:opacity-95 active:scale-98 cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-primary)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                t('auth.register') || 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>
            {t('auth.hasAccount') || 'Already have an account?'}{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t('auth.signInHere') || 'Sign in here'}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

/* ========= Register Page (Design Switcher) ========= */
export const RegisterPage: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof RegisterFormData, v: any) => {
    setError(null);
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      navigate('/login?registered=1');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed. Please contact your system administrator.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const designs = {
    design1: RegisterDesign1,
    design2: RegisterDesign2,
    design3: RegisterDesign3,
  };
  const ActiveRegister = designs[activeDesign] || RegisterDesign1;

  return (
    <ActiveRegister
      form={form}
      update={update}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};
