import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Building, Calendar,
  Camera, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Lock, Eye, EyeOff, Edit3,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUpdateUser, useUploadAvatar, getUserAvatarUrl } from '../users/api/useUsers';
import { useDesignStore } from '../../store/useDesignStore';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';

// ─── Input component (local) ──────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChange, type = 'text', icon, disabled, placeholder, readOnly,
}) => (
  <div>
    <label
      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-primary)' }}
        >
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 rounded-xl text-sm outline-none transition-all`}
        style={{
          background: disabled || readOnly ? 'var(--color-background)' : 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  type: 'success' | 'error';
  message: string;
}
const Toast: React.FC<ToastProps> = ({ type, message }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 40 }}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
    style={{
      background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color: type === 'success' ? '#10b981' : '#ef4444',
    }}
  >
    {type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
    {message}
  </motion.div>
);

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const { user, fetchMe, updateProfile } = useAuthStore();
  const { activeDesign } = useDesignStore();
  const { t } = useTranslation();
  const isGlass = activeDesign === 'design1';

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    mobileNo: user?.phone ?? '',
    department: '',
    address: '',
    gender: '',
    dob: '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);

  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch full user data on mount
  useEffect(() => {
    fetchMe();
  }, []);

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        mobileNo: user.phone ?? '',
      }));
    }
  }, [user]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const setField = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const result = await uploadAvatar.mutateAsync({ id: Number(user.id), file });
      updateProfile({ avatar: result.avatarPath });
      showToast('success', 'Profile photo updated!');
      await fetchMe();
    } catch {
      setAvatarPreview(null);
      showToast('error', 'Failed to upload photo.');
    }
  };

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await updateUser.mutateAsync({
        id: Number(user.id),
        payload: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          mobileNo: form.mobileNo,
          department: form.department || undefined,
          address: form.address || undefined,
          gender: form.gender || undefined,
          dob: form.dob || undefined,
        },
      });
      updateProfile({ firstName: updated.firstName, lastName: updated.lastName ?? '', email: updated.email ?? '' });
      await fetchMe();
      showToast('success', 'Profile saved successfully!');
    } catch {
      showToast('error', 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      showToast('error', 'Passwords do not match.');
      return;
    }
    if (pwForm.newPw.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }
    setIsChangingPw(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwForm({ current: '', newPw: '', confirm: '' });
      setShowPasswordForm(false);
      showToast('success', 'Password changed successfully!');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  // ── Avatar source ───────────────────────────────────────────────────────────
  const avatarSrc =
    avatarPreview ||
    getUserAvatarUrl(user?.avatar?.includes('http') ? null : user?.avatar?.split('/').pop() ?? null) ||
    user?.avatar ||
    '';

  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase();

  const cardCls = `rounded-2xl p-6 ${isGlass ? 'glass-card' : ''}`;
  const cardStyle = isGlass
    ? {}
    : { background: 'var(--color-surface)', border: '1px solid var(--color-border)' };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('common.profile')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your personal information, avatar, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Left Column: Avatar + Quick Info ──────────────────────────── */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className={cardCls} style={{ ...cardStyle, textAlign: 'center' }}>
            <div className="relative inline-block mb-4">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.firstName}
                  className="h-28 w-28 rounded-2xl object-cover mx-auto ring-4"
                  style={{ ringColor: 'var(--color-primary)' }}
                />
              ) : (
                <div
                  className="h-28 w-28 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto ring-4 ring-primary/20"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {initials}
                </div>
              )}

              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                style={{ background: 'var(--color-primary)' }}
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <span
              className="inline-flex items-center gap-1 mt-1.5 px-3 py-1 text-xs font-semibold rounded-full"
              style={{ background: 'var(--color-primary)', color: 'white', opacity: 0.9 }}
            >
              <Shield className="h-3 w-3" />
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </span>

            <div className="mt-5 pt-5 space-y-3 text-left" style={{ borderTop: '1px solid var(--color-border)' }}>
              {user?.email && (
                <p className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="truncate">{user.email}</span>
                </p>
              )}
              {user?.phone && (
                <p className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Phone className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Security card */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Lock className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Security
              </h3>
              <button
                onClick={() => setShowPasswordForm(p => !p)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: 'var(--color-primary)' }}
              >
                <Edit3 className="h-3 w-3" />
                {showPasswordForm ? 'Cancel' : 'Change'}
              </button>
            </div>

            <AnimatePresence>
              {showPasswordForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handlePasswordChange}
                  className="space-y-3 overflow-hidden"
                >
                  {(['current', 'newPw', 'confirm'] as const).map(k => (
                    <div key={k} className="relative">
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {k === 'current' ? 'Current Password' : k === 'newPw' ? 'New Password' : 'Confirm New'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPw[k] ? 'text' : 'password'}
                          value={pwForm[k]}
                          onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                          required
                          className="w-full pl-3 pr-9 py-2 rounded-lg text-sm outline-none"
                          style={{
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(p => ({ ...p, [k]: !p[k] }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {showPw[k] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isChangingPw}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {isChangingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Update Password
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {!showPasswordForm && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Use a strong password of at least 6 characters.
              </p>
            )}
          </div>
        </div>

        {/* ── Right Column: Edit Form ───────────────────────────────────── */}
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleSave}>
            {/* Personal Info */}
            <div className={cardCls} style={cardStyle}>
              <h3
                className="text-sm font-bold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                <User className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="First Name"
                  value={form.firstName}
                  onChange={v => setField('firstName', v)}
                  icon={<User className="h-4 w-4" />}
                  placeholder="First name"
                />
                <Field
                  label="Last Name"
                  value={form.lastName}
                  onChange={v => setField('lastName', v)}
                  icon={<User className="h-4 w-4" />}
                  placeholder="Last name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={v => setField('email', v)}
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="email@example.com"
                />
                <Field
                  label="Mobile No"
                  value={form.mobileNo}
                  onChange={v => setField('mobileNo', v)}
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="+255..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={e => setField('gender', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Field
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={v => setField('dob', v)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Work Info */}
            <div className={`${cardCls} mt-4`} style={cardStyle}>
              <h3
                className="text-sm font-bold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                <Building className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Work Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Department"
                  value={form.department}
                  onChange={v => setField('department', v)}
                  icon={<Building className="h-4 w-4" />}
                  placeholder="e.g. Sales"
                />
                <Field
                  label="Address"
                  value={form.address}
                  onChange={v => setField('address', v)}
                  icon={<MapPin className="h-4 w-4" />}
                  placeholder="Office address"
                />
              </div>

              {/* Role — read only */}
              <div className="mt-4">
                <Field
                  label="Role"
                  value={user?.role === 'admin' ? 'Administrator' : 'User'}
                  onChange={() => {}}
                  icon={<Shield className="h-4 w-4" />}
                  readOnly
                />
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
                style={{ background: 'var(--color-primary)' }}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast type={toast.type} message={toast.message} />}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
