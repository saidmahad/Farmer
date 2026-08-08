// pages/Subscription.tsx
// Group 5: Subscription.
//
// Three-plan picker (Free / Basic / Premium). Reads the user's current
// plan from GET /api/subscriptions and highlights the matching card.
//
// NOT PRODUCTION READY — the "Select plan" buttons only surface a
// "coming soon" toast. Wiring real purchasing will swap that handler for
// a POST /api/subscriptions call with the chosen plan id once a payments
// provider is integrated.

import { useEffect, useState } from 'react';
import {
  Wheat,
  Sprout,
  Sparkles,
  Loader2,
  Check,
  BadgeCheck,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { Dictionary } from '@/i18n/translations';

type PlanId = 'free' | 'basic' | 'premium';

interface SubscriptionInfo {
  plan?: PlanId | string | null;
  status?: string | null;
  expires_at?: string | null;
  features?: string[] | null;
}

interface PlanDef {
  id: PlanId;
  nameKey: keyof Dictionary;
  price: string;
  withPeriod: boolean;
  accent: string;
  icon: LucideIcon;
  features: (keyof Dictionary)[];
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    nameKey: 'subscriptionFree',
    price: '$0',
    withPeriod: false,
    accent: 'bg-secondary text-muted-foreground',
    icon: Wheat,
    features: ['subFeatureFree1', 'subFeatureFree2', 'subFeatureFree3'],
  },
  {
    id: 'basic',
    nameKey: 'subscriptionBasic',
    price: '$4.99',
    withPeriod: true,
    accent: 'bg-info-blue/10 text-info-blue',
    icon: Sprout,
    features: ['subFeatureBasic1', 'subFeatureBasic2', 'subFeatureBasic3', 'subFeatureBasic4'],
  },
  {
    id: 'premium',
    nameKey: 'subscriptionPremium',
    price: '$9.99',
    withPeriod: true,
    accent: 'bg-harvest-yellow/20 text-harvest-yellow',
    icon: Sparkles,
    features: [
      'subFeaturePremium1',
      'subFeaturePremium2',
      'subFeaturePremium3',
      'subFeaturePremium4',
      'subFeaturePremium5',
    ],
  },
];

export function Subscription() {
  const { t } = useLanguage();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<SubscriptionInfo>('/api/subscriptions')
      .then((res) => {
        if (!cancelled) setSubscription(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('subscriptionGenericError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const currentPlan = subscription?.plan ?? 'free';

  // NOT PRODUCTION READY — mock purchase flow. Replace with a real
  // POST /api/subscriptions { plan } call once payments are integrated.
  function onSelectPlan(planId: PlanId) {
    toast.info(t('subscriptionMockNotice'));
    // Real flow (future):
    // await apiFetch('/api/subscriptions', { method: 'POST', body: { plan: planId } });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('subscriptionTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subscriptionSubtitle')}</p>
      </header>

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {!subscription && !error && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('subscriptionLoading')}
        </div>
      )}

      {subscription && (
        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            const isActiveStatus = isCurrent && (subscription.status || '').toLowerCase() === 'active';

            return (
              <section
                key={plan.id}
                className={[
                  'bg-white border rounded-xl p-6 flex flex-col gap-5',
                  isCurrent ? 'border-primary-green ring-1 ring-primary-green/30' : 'border-border',
                ].join(' ')}
              >
                {/* Plan header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md ${plan.accent} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-semibold text-foreground">{t(plan.nameKey)}</h2>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-green/10 text-primary-green border border-primary-green/30">
                      <BadgeCheck className="w-3 h-3" />
                      {t('subscriptionCurrentPlan')}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t('subscriptionPrice')}
                  </p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-foreground leading-none">
                      {plan.price}
                    </span>
                    {plan.withPeriod && (
                      <span className="text-sm text-muted-foreground">{t('subscriptionPerMonth')}</span>
                    )}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    {t('subscriptionFeatures')}
                  </p>
                  <ul className="space-y-1.5">
                    {plan.features.map((key) => (
                      <li key={key} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary-green mt-0.5 shrink-0" />
                        <span>{t(key)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status meta for the active plan */}
                {isActiveStatus && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-primary-green" />
                      {t('subscriptionActive')}
                    </span>
                    {subscription.expires_at && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {t('subscriptionExpiresAt')}: {new Date(subscription.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <Button
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                  onClick={() => onSelectPlan(plan.id)}
                >
                  {isCurrent ? t('subscriptionCurrentPlan') : t('subscriptionSelectPlan')}
                </Button>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
