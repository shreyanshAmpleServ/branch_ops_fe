import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useDesignStore } from '../../store/useDesignStore';
import { Button, Input } from '../../components/ui';

const RegisterForm: React.FC<{ variant: 'glass' | 'card' | 'split'; onSubmit: (data: any) => void; isLoading: boolean }> = ({ variant, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const formFields = (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('auth.firstName')} value={form.firstName} onChange={e => update('firstName', e.target.value)} icon={<User className="h-4 w-4" />} required />
        <Input label={t('auth.lastName')} value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
      </div>
      <Input label={t('auth.email')} value={form.email} onChange={e => update('email', e.target.value)} type="email" icon={<Mail className="h-4 w-4" />} required />
      <div className="relative">
        <Input label={t('auth.password')} value={form.password} onChange={e => update('password', e.target.value)} type={showPw ? 'text' : 'password'} icon={<Lock className="h-4 w-4" />} required />
        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-9 p-1" style={{ color: 'var(--color-text-secondary)' }}>
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <Input label={t('auth.confirmPassword')} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} type="password" icon={<Lock className="h-4 w-4" />} required />
      <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
        <input type="checkbox" className="rounded accent-primary mt-0.5" required />
        {t('auth.agreeToTerms')}
      </label>
      <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading}>{t('auth.register')}</Button>
    </form>
  );

  if (variant === 'glass') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
          <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full opacity-15 animate-float" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-10 animate-float" style={{ background: 'radial-gradient(circle, #ec4899, transparent)', filter: 'blur(60px)', animationDelay: '3s' }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="text-center mb-6">
            <Sparkles className="h-10 w-10 mx-auto mb-3" style={{ color: '#8b5cf6' }} />
            <h1 className="text-2xl font-bold text-white">{t('auth.registerTitle')}</h1>
            <p className="text-sm text-gray-400 mt-1">{t('auth.registerSubtitle')}</p>
          </div>
          <div className="[&_label]:text-gray-300 [&_input]:text-white [&_input]:bg-white/5 [&_input]:border-white/10">{formFields}</div>
          <p className="text-center text-sm text-gray-400 mt-6">{t('auth.hasAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.signInHere')}</Link></p>
        </motion.div>
      </div>
    );
  }

  if (variant === 'split') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark, #1e1b4b), var(--color-primary))' }}>
          <div className="text-center text-white max-w-md">
            <h2 className="text-3xl font-bold mb-4 font-display">Join Sales App</h2>
            <p className="text-lg opacity-80">Start your journey to better business management</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--color-background)' }}>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{t('auth.registerTitle')}</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{t('auth.registerSubtitle')}</p>
            {formFields}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>{t('auth.hasAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.signInHere')}</Link></p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-3 font-bold text-white text-lg" style={{ background: 'var(--color-primary)' }}>C</div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('auth.registerTitle')}</h1>
        </div>
        <div className="p-6 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {formFields}
        </div>
        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>{t('auth.hasAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.signInHere')}</Link></p>
      </motion.div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await register(data);
      navigate('/dashboard');
    } catch {}
  };

  const variants = { design1: 'glass' as const, design2: 'card' as const, design3: 'split' as const };
  return <RegisterForm variant={variants[activeDesign]} onSubmit={handleSubmit} isLoading={isLoading} />;
};
