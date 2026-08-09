// pages/Auth.tsx
// Group 2: real Auth flow.
//
// One screen, two modes:
//   - mode='signin'  → single-step form (email + password)
//   - mode='signup'  → two-step form
//       step 1: name, email, password, confirm-password
//       step 2: region, language
//
// The screen is URL-driven (/auth?mode=signin | signup) so the Link from
// the Landing page can deep-link the right form. Mode flips client-side
// via the toggle at the top of the card.
//
// All copy is rendered via useLanguage() — translations for the 2-step
// flow live in i18n/translations.ts and cover EN/SO/AR (the AR copy
// follows the RTL flipping provided by LanguageProvider).
//
// Post-auth flow:
//   - signin success → /api/login → save token via AuthProvider →
//                     navigate('/dashboard')
//   - signup success → /api/register → save token →
//                     if step 2 had data, PATCH /api/me to attach the
//                     farm profile → navigate('/dashboard')

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  Sprout,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  MapPin,
  Languages,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth, type AuthUser } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageProvider';
import { LOCALES, type Locale } from '@/i18n/translations';

type Mode = 'signin' | 'signup';

interface ProfileForm {
  region: string;
  language: Locale;
}

export function Auth() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  const mode: Mode = params.get('mode') === 'signin' ? 'signin' : 'signup';

  // -------------------- sign-in form state ----------------------------
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInShow, setSignInShow] = useState(false);

  // -------------------- sign-up / step-1 form state --------------------
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [signupShow, setSignupShow] = useState(false);

  // -------------------- sign-up / step-2 form state --------------------
  const [profile, setProfile] = useState<ProfileForm>({
    region: '',
    language: locale,
  });

  // -------------------- flow control -----------------------------------
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the locale changes mid-session, keep the profile selection in sync.
  useEffect(() => {
    setProfile((p) => ({ ...p, language: locale }));
  }, [locale]);

  // Email format check — mirrors what the backend accepts.
  const emailLooksValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function setMode(next: Mode) {
    const np = new URLSearchParams(params);
    np.set('mode', next);
    setParams(np, { replace: true });
    setError(null);
  }

  function validateStep1(): string | null {
    if (!name.trim()) return t('authGenericError');
    if (!emailLooksValid(email)) return t('authInvalidEmail');
    if (password.length < 8) return t('authPasswordTooShort');
    if (password !== confirm) return t('authPasswordMismatch');
    return null;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!emailLooksValid(signInEmail)) return setError(t('authInvalidEmail'));
    if (signInPassword.length < 8) return setError(t('authPasswordTooShort'));

    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>('/api/login', {
        method: 'POST',
        body: { email: signInEmail.trim().toLowerCase(), password: signInPassword },
      });
      login(res.token, res.user);
      // Restore the user's saved language preference (from the profile
      // saved at signup) so the app renders in their chosen locale.
      if (res.user.language && res.user.language !== locale) setLocale(res.user.language);
      toast.success(t('authSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('authGenericError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep1Continue(e: React.FormEvent) {
    e.preventDefault();
    const v = validateStep1();
    if (v) { setError(v); return; }
    setError(null);
    setStep(2);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Apply the chosen language straight away so the rest of the app
    // (including the post-signup dashboard) appears in the user's locale.
    if (profile.language !== locale) setLocale(profile.language);

    try {
      // 1. Register with the bare minimum — backend will accept the rest
      //    as optional profile fields and return them in the JWT payload.
      const res = await apiFetch<{ token: string; user: AuthUser }>('/api/register', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          region: profile.region.trim() || null,
          language: profile.language,
        },
      });
      login(res.token, res.user);

      // 2. If anything was missing in the initial INSERT (e.g. the user
      //    skipped the optional fields and we want to be sure of the
      //    final state), PATCH /api/me to sync. The backend re-issues
      //    a fresh JWT if anything changed.
      const needsPatch =
        (res.user.region ?? null) !== (profile.region.trim() || null) ||
        (res.user.language ?? null) !== profile.language;
      if (needsPatch) {
        const patched = await apiFetch<{ token: string; user: AuthUser }>('/api/me', {
          method: 'PATCH',
          body: {
            region: profile.region.trim() || null,
            language: profile.language,
          },
        });
        login(patched.token, patched.user);
      }

      toast.success(t('authSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('authGenericError'));
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------- render ---------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-green text-white flex items-center justify-center rounded-lg">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-foreground">{t('brand')}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* -------- Left rail: marketing / brand panel -------- */}
        <aside className="hidden lg:flex flex-col justify-between bg-primary-green text-white p-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs uppercase tracking-wider">
              <Sprout className="w-4 h-4" />
              {t('brand')}
            </div>
            <h2 className="mt-6 text-3xl font-semibold leading-tight">
              {t('authMarketingTitle')}
            </h2>
            <p className="mt-4 text-white/90 text-sm leading-relaxed">
              {t('authMarketingBody')}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 text-harvest-yellow" />
              <span>{t('authMarketingPoint1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 text-harvest-yellow" />
              <span>{t('authMarketingPoint2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 text-harvest-yellow" />
              <span>{t('authMarketingPoint3')}</span>
            </li>
          </ul>
        </aside>

        {/* -------- Right rail: the form panel -------- */}
        <section className="flex items-center justify-center px-6 py-10 sm:py-14 bg-white">
          <Card className="w-full max-w-md border-0 shadow-none">
            <CardContent className="pt-0 pb-6 space-y-6">
              {/* Mode toggle */}
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-foreground">
                  {mode === 'signin' ? t('authSignInTitle') : t('authSignUpTitle')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {mode === 'signin' ? t('authSignInSubtitle') : t('authSignUpSubtitle')}
                </p>
              </div>

              {/* Step indicator (sign-up only) */}
              {mode === 'signup' && <StepIndicator step={step} t={t} />}

              {error && (
                <div
                  role="alert"
                  className="text-sm text-danger-red bg-danger-red/10 border border-danger-red/30 rounded-md px-3 py-2"
                >
                  {error}
                </div>
              )}

              {mode === 'signin' ? (
                <SignInForm
                  email={signInEmail}
                  setEmail={setSignInEmail}
                  password={signInPassword}
                  setPassword={setSignInPassword}
                  show={signInShow}
                  setShow={setSignInShow}
                  submitting={submitting}
                  onSubmit={handleSignIn}
                  t={t}
                />
              ) : step === 1 ? (
                <SignUpStep1
                  name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  confirm={confirm}
                  setConfirm={setConfirm}
                  show={signupShow}
                  setShow={setSignupShow}
                  onSubmit={handleStep1Continue}
                  t={t}
                />
              ) : (
                <SignUpStep2
                  profile={profile}
                  setProfile={setProfile}
                  submitting={submitting}
                  onSubmit={handleCreateAccount}
                  onBack={() => { setError(null); setStep(1); }}
                  t={t}
                  locale={locale}
                  setLocale={setLocale}
                />
              )}

              {/* Mode switcher */}
              <p className="text-sm text-muted-foreground text-center">
                {mode === 'signin' ? (
                  <>
                    {t('authNoAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary-green font-medium hover:underline"
                    >
                      {t('authSignUpCta')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('authHaveAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setStep(1); }}
                      className="text-primary-green font-medium hover:underline"
                    >
                      {t('authSignInCta')}
                    </button>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

// -------------------------- subcomponents --------------------------

function StepIndicator({ step, t }: { step: 1 | 2; t: (k: string) => string }) {
  const steps = [
    { n: 1, label: t('authStepAccount') },
    { n: 2, label: t('authStepFarm') },
  ];
  return (
    <ol className="flex items-center gap-3 text-sm" aria-label="progress">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <li key={s.n} className="flex items-center gap-2 flex-1">
            <span
              className={[
                'w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-medium border',
                active || done
                  ? 'bg-primary-green text-white border-primary-green'
                  : 'bg-white text-muted-foreground border-border',
              ].join(' ')}
            >
              {s.n}
            </span>
            <span className={active ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="flex-1 h-px bg-border" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground block">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            className="absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function inputClass(extra?: string) {
  // Pad the start so the icon has room without overlapping the user's text.
  return ['h-11', extra ?? 'ps-9'].filter(Boolean).join(' ');
}

function SignInForm(props: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  t: (k: string) => string;
}) {
  const { email, setEmail, password, setPassword, show, setShow, submitting, onSubmit, t } = props;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label={t('authEmail')} htmlFor="si-email" icon={<Mail className="w-4 h-4" />}>
        <Input
          id="si-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass()}
          placeholder="you@example.com"
        />
      </Field>
      <Field label={t('authPassword')} htmlFor="si-password" icon={<Lock className="w-4 h-4" />}>
        <Input
          id="si-password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass('pe-10')}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
          aria-label={show ? 'hide password' : 'show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </Field>
      <Button type="submit" className="w-full h-11" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        {t('authSignInCta')}
      </Button>
    </form>
  );
}

function SignUpStep1(props: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: (k: string) => string;
}) {
  const {
    name, setName, email, setEmail, password, setPassword,
    confirm, setConfirm, show, setShow, onSubmit, t,
  } = props;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label={t('authName')} htmlFor="su-name" icon={<User className="w-4 h-4" />}>
        <Input
          id="su-name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass()}
          placeholder="Salma Patel"
        />
      </Field>
      <Field label={t('authEmail')} htmlFor="su-email" icon={<Mail className="w-4 h-4" />}>
        <Input
          id="su-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass()}
          placeholder="you@example.com"
        />
      </Field>
      <Field label={t('authPassword')} htmlFor="su-password" icon={<Lock className="w-4 h-4" />}>
        <Input
          id="su-password"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass('pe-10')}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
          aria-label={show ? 'hide password' : 'show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </Field>
      <Field label={t('authConfirmPassword')} htmlFor="su-confirm" icon={<Lock className="w-4 h-4" />}>
        <Input
          id="su-confirm"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass()}
          placeholder="••••••••"
        />
      </Field>
      <Button type="submit" className="w-full h-11">
        {t('authNext')}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

function SignUpStep2(props: {
  profile: ProfileForm;
  setProfile: React.Dispatch<React.SetStateAction<ProfileForm>>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  t: (k: string) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  const { profile, setProfile, submitting, onSubmit, onBack, t, locale, setLocale } = props;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label={t('authRegion')} htmlFor="su-region" icon={<MapPin className="w-4 h-4" />}>
        <Input
          id="su-region"
          value={profile.region}
          onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))}
          className={inputClass()}
          placeholder={t('authRegionPlaceholder')}
        />
      </Field>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground block">
          {t('authLanguage')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LOCALES.map((l) => {
            const active = locale === l.code;
            return (
              <button
                type="button"
                key={l.code}
                onClick={() => setLocale(l.code as Locale)}
                className={[
                  'h-10 rounded-md border text-sm transition-all',
                  active
                    ? 'border-primary-green bg-primary-green/10 text-primary-green font-medium'
                    : 'border-border text-foreground hover:border-primary-green/50',
                ].join(' ')}
              >
                <Languages className="w-3.5 h-3.5 inline-block me-1.5 rtl:ms-1.5" />
                {l.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-11" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          {t('authBack')}
        </Button>
        <Button type="submit" className="flex-1 h-11" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {t('authCreateAccount')}
        </Button>
      </div>
    </form>
  );
}