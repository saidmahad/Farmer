// components/layout/Layout.tsx
// App shell: desktop sidebar + topbar + mobile bottom nav, per the Figma
// Layout.tsx. Renders <Outlet /> for the active page. The angular pages
// are behind react-router routes, so navigation uses <Link> and the
// active state is derived from the current pathname.

import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Sprout,
  TestTube,
  BookOpen,
  Calendar,
  Video,
  MessageSquare,
  FileText,
  Bug,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  Globe,
  Check,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { LOCALES, type Dictionary } from '@/i18n/translations';

interface NavItem {
  id: string;
  labelKey: keyof Dictionary;
  icon: LucideIcon;
  path: string;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'navDashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'crop-recommendation', labelKey: 'navCropRecommendation', icon: Sprout, path: '/crop-recommendation' },
  { id: 'soil-prediction', labelKey: 'navSoilPrediction', icon: TestTube, path: '/soil-prediction' },
  { id: 'plant-explorer', labelKey: 'navPlantExplorer', icon: BookOpen, path: '/plant-explorer' },
  { id: 'disease-library', labelKey: 'navDiseaseLibrary', icon: Bug, path: '/disease-library' },
  { id: 'growth-calendar', labelKey: 'navGrowthCalendar', icon: Calendar, path: '/growth-calendar' },
  { id: 'video-hub', labelKey: 'navVideoHub', icon: Video, path: '/video-hub' },
  { id: 'feedback', labelKey: 'navFeedback', icon: MessageSquare, path: '/feedback' },
  { id: 'reports', labelKey: 'navReports', icon: FileText, path: '/reports' },
  { id: 'subscription', labelKey: 'navSubscription', icon: CreditCard, path: '/subscription' },
  { id: 'admin', labelKey: 'navAdmin', icon: ShieldCheck, path: '/admin' },
];

const mobileNavItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'navDashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'crop-recommendation', labelKey: 'mobileCrops', icon: Sprout, path: '/crop-recommendation' },
  { id: 'plant-explorer', labelKey: 'mobilePlants', icon: BookOpen, path: '/plant-explorer' },
  { id: 'growth-calendar', labelKey: 'mobileCalendar', icon: Calendar, path: '/growth-calendar' },
  { id: 'chatbot', labelKey: 'mobileMore', icon: Menu, path: '/chatbot' },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'FA';
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const activeId = navigationItems.find((n) => n.path === pathname)?.id ?? 'dashboard';

  const displayName = user?.name || 'John Farmer';
  const displayRole = user?.role || t('topbarRole').toLowerCase();
  const currentShort = LOCALES.find((l) => l.code === locale)?.short ?? 'EN';

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop / mobile sidebar — anchored to the start side via logical props
          so RTL (Arabic) flips it to the right automatically. */}
      <aside
        className={`fixed top-0 start-0 z-50 h-full w-64 bg-white border-e border-border
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-green text-white flex items-center justify-center rounded-lg">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-foreground">{t('brand')}</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start
                  transition-all duration-200 hover:bg-secondary
                  ${isActive ? 'bg-primary-green text-white' : 'text-foreground hover:text-foreground'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Column — pushed in from the start side so it flips for RTL. */}
      <div className="lg:ms-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>

              <div className="relative max-w-md hidden sm:block">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  className="ps-10 bg-input-background border-0 focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setLangOpen((o) => !o)}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentShort}</span>
                </Button>
                {langOpen && (
                  <div className="absolute end-0 top-full mt-2 w-48 rounded-lg border border-border bg-popover shadow-xl p-2 z-50">
                    {LOCALES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLocale(l.code);
                          setLangOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-secondary"
                      >
                        <span>{l.native}</span>
                        {l.code === locale && <Check className="w-4 h-4 text-primary-green" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -end-1 w-2 h-2 p-0 bg-danger-red" />
              </Button>

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-end">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{displayRole}</p>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary-green text-white">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title={t('signOut')}
                  aria-label={t('signOut')}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40">
        <div className="flex items-center justify-around py-2 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              (activeId === item.id) ||
              (item.id === 'chatbot' && pathname === '/chatbot');
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  transition-colors duration-200
                  ${isActive ? 'text-primary-green' : 'text-muted-foreground'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}