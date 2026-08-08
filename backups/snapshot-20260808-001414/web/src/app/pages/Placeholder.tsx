// pages/Placeholder.tsx
// Temporary stand-in for routes not yet built in the incremental plan.
// Replaced with the real page component as each build group lands.

import { Sprout } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageProvider';

export function Placeholder({ title }: { title: string }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('comingSoon')}</p>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 bg-white">
        <div className="w-14 h-14 rounded-full bg-primary-green/10 flex items-center justify-center">
          <Sprout className="w-7 h-7 text-primary-green" />
        </div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          This screen is part of the build roadmap and will be wired up next.
        </p>
      </Card>
    </div>
  );
}
