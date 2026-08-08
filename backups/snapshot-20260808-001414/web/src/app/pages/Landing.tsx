// pages/Landing.tsx
// Group 2: Figma-style landing page.
//
// Sections, in order:
//   1. Top bar with brand + auth CTAs.
//   2. Hero: eyebrow, headline, body, primary CTA → /auth?mode=signup,
//      secondary CTA → /auth?mode=signin. Trust badge under the buttons.
//   3. Quick-actions strip — five tiles, each linking into the protected
//      routes. They require auth, so the click is also a deep link that
//      the router will bounce through /auth if the user isn't signed in.
//   4. Feature grid — four short value props.
//   5. Footer.

import {
  Sprout,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Wheat,
  FlaskConical,
  Trees,
  Bug,
  Globe,
  CloudSun,
  Lock,
  HeartHandshake,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageProvider';

interface QuickAction {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey:
    | 'landingQuickActionDashboard'
    | 'landingQuickActionCrops'
    | 'landingQuickActionSoil'
    | 'landingQuickActionPlants'
    | 'landingQuickActionDiseases';
  descKey:
    | 'landingQuickActionDashboardDesc'
    | 'landingQuickActionCropsDesc'
    | 'landingQuickActionSoilDesc'
    | 'landingQuickActionPlantsDesc'
    | 'landingQuickActionDiseasesDesc';
  accent: string; // tailwind class for the icon chip background
  iconColor: string; // tailwind class for the icon itself
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    titleKey: 'landingQuickActionDashboard',
    descKey: 'landingQuickActionDashboardDesc',
    accent: 'bg-primary-green/10',
    iconColor: 'text-primary-green',
  },
  {
    path: '/crop-recommendation',
    icon: Wheat,
    titleKey: 'landingQuickActionCrops',
    descKey: 'landingQuickActionCropsDesc',
    accent: 'bg-harvest-yellow/20',
    iconColor: 'text-harvest-yellow',
  },
  {
    path: '/soil-prediction',
    icon: FlaskConical,
    titleKey: 'landingQuickActionSoil',
    descKey: 'landingQuickActionSoilDesc',
    accent: 'bg-info-blue/10',
    iconColor: 'text-info-blue',
  },
  {
    path: '/plant-explorer',
    icon: Trees,
    titleKey: 'landingQuickActionPlants',
    descKey: 'landingQuickActionPlantsDesc',
    accent: 'bg-primary-green/10',
    iconColor: 'text-primary-green',
  },
  {
    path: '/disease-library',
    icon: Bug,
    titleKey: 'landingQuickActionDiseases',
    descKey: 'landingQuickActionDiseasesDesc',
    accent: 'bg-danger-red/10',
    iconColor: 'text-danger-red',
  },
];

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  titleKey:
    | 'landingFeature1Title'
    | 'landingFeature2Title'
    | 'landingFeature3Title'
    | 'landingFeature4Title';
  bodyKey:
    | 'landingFeature1Body'
    | 'landingFeature2Body'
    | 'landingFeature3Body'
    | 'landingFeature4Body';
}

const FEATURES: Feature[] = [
  {
    icon: Globe,
    titleKey: 'landingFeature1Title',
    bodyKey: 'landingFeature1Body',
  },
  {
    icon: CloudSun,
    titleKey: 'landingFeature2Title',
    bodyKey: 'landingFeature2Body',
  },
  {
    icon: Lock,
    titleKey: 'landingFeature3Title',
    bodyKey: 'landingFeature3Body',
  },
  {
    icon: HeartHandshake,
    titleKey: 'landingFeature4Title',
    bodyKey: 'landingFeature4Body',
  },
];

export function Landing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* -------- Top bar -------- */}
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-green text-white flex items-center justify-center rounded-lg">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-foreground">{t('brand')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth?mode=signin">
                <LogIn className="w-4 h-4" />
                {t('landingSignIn')}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth?mode=signup">
                {t('landingGetStarted')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* -------- Hero -------- */}
        <section className="px-6">
          <div className="max-w-5xl mx-auto pt-16 pb-12 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-green/10 text-primary-green text-sm font-medium">
              <Sprout className="w-4 h-4" />
              {t('landingHeroEyebrow')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-foreground">
              {t('landingHeroTitle')}
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg leading-relaxed">
              {t('landingHeroBody')}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">
                  {t('landingPrimaryCta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth?mode=signin">{t('landingSecondaryCta')}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('landingTrustBadge')}</p>
          </div>
        </section>

        {/* -------- Quick actions ──────── */}
        <section className="px-6 bg-white border-y border-border">
          <div className="max-w-6xl mx-auto py-12">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl font-semibold text-foreground">
                {t('landingQuickActionsTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('landingQuickActionsBody')}
              </p>
            </div>
            <ul className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <li key={qa.path}>
                    <Link
                      to={qa.path}
                      className="group block h-full rounded-xl border border-border bg-white p-4 transition-all hover:border-primary-green hover:shadow-sm"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg ${qa.accent} ${qa.iconColor} flex items-center justify-center mb-3`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-medium text-foreground text-sm mb-1">
                        {t(qa.titleKey)}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t(qa.descKey)}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-green opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('landingGetStarted')}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* -------- Features ──────── */}
        <section className="px-6">
          <div className="max-w-6xl mx-auto py-16">
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.titleKey} className="space-y-2">
                    <div className="w-9 h-9 rounded-md bg-primary-green/10 text-primary-green flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">{t(f.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(f.bodyKey)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      {/* -------- Footer ──────── */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-muted-foreground">
          {t('landingFooter')}
        </div>
      </footer>
    </div>
  );
}