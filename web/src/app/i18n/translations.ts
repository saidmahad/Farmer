// i18n/translations.ts
// Locale metadata + UI string dictionary for the languages we ship.
//
// Three locales: English (default), Somali (so), Arabic (ar).
// Arabic is RTL — LanguageProvider applies `dir="rtl"` to <html> for it.
//
// Add new languages here by extending `Locale` and the LOCALES + dictionaries
// arrays; the rest of the app reads strings via useLanguage() -> t(key).

export type Locale = 'en' | 'so' | 'ar';

export interface LocaleMeta {
  code: Locale;
  short: string; // shortcode shown in the topbar (e.g. "EN")
  native: string; // the language's own name for the picker
  rtl?: boolean; // true for right-to-left scripts
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', short: 'EN', native: 'English' },
  { code: 'so', short: 'SO', native: 'Soomaali' },
  { code: 'ar', short: 'AR', native: 'العربية', rtl: true },
];

export interface Dictionary {
  brand: string;
  searchPlaceholder: string;
  navDashboard: string;
  navCropRecommendation: string;
  navSoilPrediction: string;
  navPlantExplorer: string;
  navDiseaseLibrary: string;
  navGrowthCalendar: string;
  navVideoHub: string;
  navFeedback: string;
  navReports: string;
  navSubscription: string;
  navAdmin: string;
  topbarRole: string;
  mobileCrops: string;
  mobilePlants: string;
  mobileCalendar: string;
  mobileMore: string;
  signOut: string;
  comingSoon: string;
  // Auth pages
  authTagline: string;
  authSignInTitle: string;
  authSignUpTitle: string;
  authSignInSubtitle: string;
  authSignUpSubtitle: string;
  authName: string;
  authEmail: string;
  authPassword: string;
  authConfirmPassword: string;
  authRegion: string;
  authRegionPlaceholder: string;
  authLandSize: string;
  authLandSizePlaceholder: string;
  authFarmType: string;
  authFarmTypeSubsistence: string;
  authFarmTypeCommercial: string;
  authFarmTypeMixed: string;
  authFarmTypeOrganic: string;
  authLanguage: string;
  authNext: string;
  authBack: string;
  authCreateAccount: string;
  authSignIn: string;
  authSignInCta: string;
  authSignUpCta: string;
  authHaveAccount: string;
  authNoAccount: string;
  authStepAccount: string;
  authStepFarm: string;
  authStepDone: string;
  authSuccess: string;
  authInvalidEmail: string;
  authPasswordTooShort: string;
  authPasswordMismatch: string;
  authGenericError: string;
  authLanguageEn: string;
  authLanguageSo: string;
  authLanguageAr: string;
  authMarketingTitle: string;
  authMarketingBody: string;
  authMarketingPoint1: string;
  authMarketingPoint2: string;
  authMarketingPoint3: string;
  // Landing
  landingHeroEyebrow: string;
  landingHeroTitle: string;
  landingHeroBody: string;
  landingPrimaryCta: string;
  landingSecondaryCta: string;
  landingTrustBadge: string;
  landingQuickActionsTitle: string;
  landingQuickActionsBody: string;
  landingQuickActionDashboard: string;
  landingQuickActionDashboardDesc: string;
  landingQuickActionCrops: string;
  landingQuickActionCropsDesc: string;
  landingQuickActionSoil: string;
  landingQuickActionSoilDesc: string;
  landingQuickActionPlants: string;
  landingQuickActionPlantsDesc: string;
  landingQuickActionDiseases: string;
  landingQuickActionDiseasesDesc: string;
  landingFeature1Title: string;
  landingFeature1Body: string;
  landingFeature2Title: string;
  landingFeature2Body: string;
  landingFeature3Title: string;
  landingFeature3Body: string;
  landingFeature4Title: string;
  landingFeature4Body: string;
  landingFooter: string;
  landingSignIn: string;
  landingGetStarted: string;
  // Dashboard
  dashGreetingMorning: string;
  dashGreetingAfternoon: string;
  dashGreetingEvening: string;
  dashSubtitle: string;
  dashWeatherTitle: string;
  dashWeatherBody: string;
  dashWeatherHumidity: string;
  dashWeatherWind: string;
  dashWeatherRain: string;
  dashStatCrops: string;
  dashStatCropsHint: string;
  dashStatLand: string;
  dashStatLandHint: string;
  dashStatLanguages: string;
  dashStatLanguagesHint: string;
  dashStatSoil: string;
  dashStatSoilHint: string;
  dashRecentTitle: string;
  dashRecentBody: string;
  dashRecentEmpty: string;
  dashRecentViewAll: string;
  dashQuickActionsTitle: string;
  dashQuickActionsBody: string;
  dashActionGetAdvice: string;
  dashActionGetAdviceDesc: string;
  dashActionSoil: string;
  dashActionSoilDesc: string;
  dashActionDisease: string;
  dashActionDiseaseDesc: string;
  dashActionChatbot: string;
  dashActionChatbotDesc: string;
  dashTipTitle: string;
  dashTipBody: string;
  // CropRecommendation
  cropTitle: string;
  cropSubtitle: string;
  cropSearchPlaceholder: string;
  cropFilterAll: string;
  cropFilterCereals: string;
  cropFilterVegetables: string;
  cropFilterCash: string;
  cropFilterOilseeds: string;
  cropEmptyTitle: string;
  cropEmptyBody: string;
  cropBackToList: string;
  cropSeason: string;
  cropDaysToHarvest: string;
  cropPlantingMethod: string;
  cropIrrigation: string;
  cropFertilizer: string;
  cropCommonPests: string;
  cropAdviceTitle: string;
  cropAdviceLoading: string;
  cropAdviceAiBadge: string;
  cropAdviceTemplateBadge: string;
  cropAdviceRefresh: string;
  cropAdviceEmpty: string;
  cropAdviceError: string;
  cropGetAdvice: string;
  cropViewDetails: string;
  // SoilPrediction
  soilTitle: string;
  soilSubtitle: string;
  soilFormTitle: string;
  soilImage: string;
  soilClearImage: string;
  soilUploadCta: string;
  soilUploadHint: string;
  soilType: string;
  soilTypePlaceholder: string;
  soilPh: string;
  soilNitrogen: string;
  soilPhosphorus: string;
  soilPotassium: string;
  soilOrganicMatter: string;
  soilSalinity: string;
  soilSubmit: string;
  soilSubmitting: string;
  soilSuccess: string;
  soilNeedImage: string;
  soilGenericError: string;
  soilResultLabel: string;
  soilConfidence: string;
  soilRecommendations: string;
  soilHistoryTitle: string;
  soilHistoryEmpty: string;
  soilLoading: string;
  // PlantExplorer
  plantsTitle: string;
  plantsSubtitle: string;
  plantsSearchPlaceholder: string;
  plantsFilterAll: string;
  plantsResultCount: string;
  plantsBackToList: string;
  plantsLoading: string;
  plantsOverview: string;
  plantsAgronomy: string;
  plantsPests: string;
  plantsResources: string;
  plantsEmpty: string;
  plantsDuration: string;
  plantsYield: string;
  plantsDifficulty: string;
  plantsMarket: string;
  plantsWaterNeed: string;
  plantsClimate: string;
  plantsRegion: string;
  plantsSeasonShort: string;
  plantsGenericError: string;
  // DiseaseLibrary
  diseaseTitle: string;
  diseaseSubtitle: string;
  diseaseSearchPlaceholder: string;
  diseaseFilterAll: string;
  diseaseBackToList: string;
  diseaseLoading: string;
  diseaseSymptoms: string;
  diseaseTreatment: string;
  diseasePrevention: string;
  diseaseGenericError: string;
  // GrowthCalendar
  calendarTitle: string;
  calendarSubtitle: string;
  calendarFilterAll: string;
  calendarCropColumn: string;
  calendarLoading: string;
  calendarFootnote: string;
  calendarGenericError: string;
  // VideoHub
  videoTitle: string;
  videoSubtitle: string;
  videoSearchPlaceholder: string;
  videoFilterAll: string;
  videoEmptyTitle: string;
  videoEmptyBody: string;
  videoLoading: string;
  videoWatch: string;
  videoClose: string;
  videoGenericError: string;
  // Feedback
  feedbackTitle: string;
  feedbackSubtitle: string;
  feedbackRecentTitle: string;
  feedbackCategory: string;
  feedbackCategoryBug: string;
  feedbackCategoryFeature: string;
  feedbackCategoryGeneral: string;
  feedbackRating: string;
  feedbackMessage: string;
  feedbackScreenshot: string;
  feedbackUploadCta: string;
  feedbackUploadHint: string;
  feedbackRemoveImage: string;
  feedbackSubmit: string;
  feedbackSubmitting: string;
  feedbackSuccess: string;
  feedbackNeedMessage: string;
  feedbackEmpty: string;
  feedbackLoading: string;
  feedbackGenericError: string;
  feedbackStatusOpen: string;
  feedbackStatusInProgress: string;
  feedbackStatusResolved: string;
  // Reports
  reportsTitle: string;
  reportsSubtitle: string;
  reportsExport: string;
  reportsExportSuccess: string;
  reportsCropCount: string;
  reportsSoilCount: string;
  reportsFeedbackCount: string;
  reportsChatCount: string;
  reportsLastCrop: string;
  reportsActivityTitle: string;
  reportsActivityBody: string;
  reportsLoading: string;
  reportsGenericError: string;
  // Chatbot
  chatTitle: string;
  chatSubtitle: string;
  chatPlaceholder: string;
  chatSend: string;
  chatClear: string;
  chatEmpty: string;
  chatLoading: string;
  chatCleared: string;
  chatGenericError: string;
  chatYou: string;
  chatAssistant: string;
  // Subscription
  subscriptionTitle: string;
  subscriptionSubtitle: string;
  subscriptionCurrentPlan: string;
  subscriptionFree: string;
  subscriptionBasic: string;
  subscriptionPremium: string;
  subscriptionPrice: string;
  subscriptionPerMonth: string;
  subscriptionFeatures: string;
  subscriptionSelectPlan: string;
  subscriptionMockNotice: string;
  subscriptionActive: string;
  subscriptionExpiresAt: string;
  subscriptionGenericError: string;
  subscriptionLoading: string;
  subFeatureFree1: string;
  subFeatureFree2: string;
  subFeatureFree3: string;
  subFeatureBasic1: string;
  subFeatureBasic2: string;
  subFeatureBasic3: string;
  subFeatureBasic4: string;
  subFeaturePremium1: string;
  subFeaturePremium2: string;
  subFeaturePremium3: string;
  subFeaturePremium4: string;
  subFeaturePremium5: string;
  // AdminDashboard
  adminTitle: string;
  adminFeedback: string;
  adminStatus: string;
  adminNotes: string;
  adminUpdate: string;
  adminUpdateSuccess: string;
  adminFilterAll: string;
  adminFilterOpen: string;
  adminFilterInProgress: string;
  adminFilterResolved: string;
  adminUserName: string;
  adminCategory: string;
  adminRating: string;
  adminMessage: string;
  adminDate: string;
  adminLoading: string;
  adminGenericError: string;
  adminEmpty: string;
  adminNoNotes: string;
  adminExpand: string;
  // Shared
  commonHigh: string;
  commonMedium: string;
  commonLow: string;
  commonAll: string;
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    brand: 'FarmerAI',
    searchPlaceholder: 'Search crops, diseases, tutorials...',
    navDashboard: 'Dashboard',
    navCropRecommendation: 'Crop Recommendation',
    navSoilPrediction: 'Soil Prediction',
    navPlantExplorer: 'Plant Explorer',
    navDiseaseLibrary: 'Disease Library',
    navGrowthCalendar: 'Growth Calendar',
    navVideoHub: 'Video Hub',
    navFeedback: 'Feedback',
    navReports: 'Reports',
    navSubscription: 'Subscription',
    navAdmin: 'Admin',
    topbarRole: 'Farmer',
    mobileCrops: 'Crops',
    mobilePlants: 'Plants',
    mobileCalendar: 'Calendar',
    mobileMore: 'More',
    signOut: 'Sign out',
    comingSoon: 'Coming soon',
    authTagline: 'AI-powered guidance for every farmer',
    authSignInTitle: 'Welcome back',
    authSignUpTitle: 'Create your farm profile',
    authSignInSubtitle: 'Sign in to continue to your dashboard.',
    authSignUpSubtitle: 'Two quick steps. We use this to tailor your recommendations.',
    authName: 'Full name',
    authEmail: 'Email',
    authPassword: 'Password',
    authConfirmPassword: 'Confirm password',
    authRegion: 'Region or district',
    authRegionPlaceholder: 'e.g. Punjab, Kano, Gharb Darfur',
    authLandSize: 'Land size (acres)',
    authLandSizePlaceholder: 'optional',
    authFarmType: 'Farm type',
    authFarmTypeSubsistence: 'Subsistence',
    authFarmTypeCommercial: 'Commercial',
    authFarmTypeMixed: 'Mixed',
    authFarmTypeOrganic: 'Organic',
    authLanguage: 'Language',
    authNext: 'Next',
    authBack: 'Back',
    authCreateAccount: 'Create account',
    authSignIn: 'Sign in',
    authSignInCta: 'Sign in',
    authSignUpCta: 'Sign up',
    authHaveAccount: 'Already have an account?',
    authNoAccount: 'New to FarmerAI?',
    authStepAccount: 'Account',
    authStepFarm: 'Farm',
    authStepDone: 'Done',
    authSuccess: 'Your account is ready. Loading your dashboard…',
    authInvalidEmail: 'Please enter a valid email address.',
    authPasswordTooShort: 'Password must be at least 8 characters.',
    authPasswordMismatch: 'Passwords do not match.',
    authGenericError: 'Something went wrong. Please try again.',
    authLanguageEn: 'English',
    authLanguageSo: 'Somali',
    authLanguageAr: 'Arabic',
    authMarketingTitle: 'Smarter farming starts here',
    authMarketingBody: 'Personalized crop recommendations, soil insights, and a complete farm library — all in one place.',
    authMarketingPoint1: 'Tailored to your region and soil',
    authMarketingPoint2: 'EN, SO, and AR with full RTL support',
    authMarketingPoint3: 'Works offline once you sign in',
    landingHeroEyebrow: 'Smart farming for every field',
    landingHeroTitle: 'Grow smarter with FarmerAI',
    landingHeroBody: 'Crop recommendations, soil insights, disease detection and growth tracking — tailored to your farm and your region.',
    landingPrimaryCta: 'Get started',
    landingSecondaryCta: 'Sign in',
    landingTrustBadge: 'Built with agronomists. Powered by Claude.',
    landingQuickActionsTitle: 'Where do you want to start?',
    landingQuickActionsBody: 'Five shortcuts to the screens farmers open most. Everything else lives in the sidebar.',
    landingQuickActionDashboard: 'Dashboard',
    landingQuickActionDashboardDesc: "Today's weather, tasks and quick advice.",
    landingQuickActionCrops: 'Crop advice',
    landingQuickActionCropsDesc: 'Pick a crop, get tailored advice.',
    landingQuickActionSoil: 'Soil insights',
    landingQuickActionSoilDesc: 'Upload a photo and read its status.',
    landingQuickActionPlants: 'Plant explorer',
    landingQuickActionPlantsDesc: 'Browse the full Figma catalog.',
    landingQuickActionDiseases: 'Disease library',
    landingQuickActionDiseasesDesc: 'Identify symptoms and treatments.',
    landingFeature1Title: 'Region-tuned advice',
    landingFeature1Body: 'Recommendations respect your district, soil type and language.',
    landingFeature2Title: 'Bilingual, with RTL',
    landingFeature2Body: 'English, Somali, and Arabic with full right-to-left support.',
    landingFeature3Title: 'Works on slow links',
    landingFeature3Body: 'Designed for rural connectivity — light on assets, friendly on bandwidth.',
    landingFeature4Title: 'Your data stays with you',
    landingFeature4Body: 'No third-party analytics; only the minimum needed to tailor advice.',
    landingFooter: '© 2026 FarmerAI — built for farmers, with farmers.',
    landingSignIn: 'Sign in',
    landingGetStarted: 'Get started',
    dashGreetingMorning: 'Good morning',
    dashGreetingAfternoon: 'Good afternoon',
    dashGreetingEvening: 'Good evening',
    dashSubtitle: "Here's what's happening on your farm today.",
    dashWeatherTitle: "Today's weather",
    dashWeatherBody: 'Mild conditions. Good day for scouting your fields.',
    dashWeatherHumidity: 'Humidity',
    dashWeatherWind: 'Wind',
    dashWeatherRain: 'Rain chance',
    dashStatCrops: 'Crops in catalog',
    dashStatCropsHint: 'tuned to your region',
    dashStatLand: 'Land tracked',
    dashStatLandHint: 'across your farm profile',
    dashStatLanguages: 'Languages',
    dashStatLanguagesHint: 'EN · SO · AR',
    dashStatSoil: 'Soil insights',
    dashStatSoilHint: 'upload a photo to read it',
    dashRecentTitle: 'Recent advice',
    dashRecentBody: 'A quick look at the crops you asked about most recently.',
    dashRecentEmpty: 'No advice yet. Pick a crop to get your first recommendation.',
    dashRecentViewAll: 'Browse all crops',
    dashQuickActionsTitle: 'Where to next?',
    dashQuickActionsBody: 'Four one-tap shortcuts to the screens you open most.',
    dashActionGetAdvice: 'Get crop advice',
    dashActionGetAdviceDesc: 'Pick a crop, get tailored planting guidance.',
    dashActionSoil: 'Soil prediction',
    dashActionSoilDesc: 'Upload a soil photo for an instant read.',
    dashActionDisease: 'Disease library',
    dashActionDiseaseDesc: 'Identify symptoms and treatments.',
    dashActionChatbot: 'Ask the chatbot',
    dashActionChatbotDesc: 'Get a quick answer in plain language.',
    dashTipTitle: "Today's tip",
    dashTipBody: 'Walk your fields before mid-morning. You\'ll spot pests, nutrient issues, and moisture problems before they escalate — well before noon heat sets in.',
    cropTitle: 'Crop recommendation',
    cropSubtitle: 'Pick a crop to see tailored planting, irrigation, and fertilizer advice.',
    cropSearchPlaceholder: 'Search crops...',
    cropFilterAll: 'All',
    cropFilterCereals: 'Cereals',
    cropFilterVegetables: 'Vegetables',
    cropFilterCash: 'Cash crops',
    cropFilterOilseeds: 'Oilseeds',
    cropEmptyTitle: 'No crops match your search',
    cropEmptyBody: 'Try a different keyword or clear the filter to see all 8 crops.',
    cropBackToList: 'Back to crops',
    cropSeason: 'Season',
    cropDaysToHarvest: 'Days to harvest',
    cropPlantingMethod: 'Planting method',
    cropIrrigation: 'Irrigation',
    cropFertilizer: 'Fertilizer',
    cropCommonPests: 'Common pests',
    cropAdviceTitle: 'Recommendation',
    cropAdviceLoading: 'Generating your recommendation…',
    cropAdviceAiBadge: 'AI-generated',
    cropAdviceTemplateBadge: 'From the catalog',
    cropAdviceRefresh: 'Refresh advice',
    cropAdviceEmpty: 'Pick a crop from the grid to see its recommendation here.',
    cropAdviceError: 'Could not load advice. Please try again.',
    cropGetAdvice: 'Get advice',
    cropViewDetails: 'View details',
    soilTitle: 'Soil prediction',
    soilSubtitle: 'Upload a soil photo and any readings you have. We give back a soil-type guess plus practical, actionable recommendations.',
    soilFormTitle: 'Submit a sample',
    soilImage: 'Soil image',
    soilClearImage: 'Remove image',
    soilUploadCta: 'Click to upload a soil photo',
    soilUploadHint: 'JPG or PNG up to 10 MB',
    soilType: 'Soil type (optional)',
    soilTypePlaceholder: 'Pick a soil type',
    soilPh: 'pH',
    soilNitrogen: 'Nitrogen',
    soilPhosphorus: 'Phosphorus',
    soilPotassium: 'Potassium',
    soilOrganicMatter: 'Organic matter',
    soilSalinity: 'Salinity',
    soilSubmit: 'Analyze soil',
    soilSubmitting: 'Analyzing…',
    soilSuccess: 'Soil analyzed',
    soilNeedImage: 'A soil image is required.',
    soilGenericError: 'Could not analyze soil.',
    soilResultLabel: 'Predicted soil type',
    soilConfidence: 'Confidence',
    soilRecommendations: 'Recommendations',
    soilHistoryTitle: 'Recent submissions',
    soilHistoryEmpty: 'No submissions yet. Your past predictions will appear here.',
    soilLoading: 'Loading recent submissions…',
    plantsTitle: 'Plant explorer',
    plantsSubtitle: 'Browse the verified crop catalog. Click any plant for agronomy, pest, and resource details.',
    plantsSearchPlaceholder: 'Search plants by name, scientific name, or description...',
    plantsFilterAll: 'All',
    plantsResultCount: 'crops',
    plantsBackToList: 'Back to plants',
    plantsLoading: 'Loading plant details…',
    plantsOverview: 'Overview',
    plantsAgronomy: 'Agronomy',
    plantsPests: 'Common pests',
    plantsResources: 'Learning resources',
    plantsEmpty: 'Nothing here yet.',
    plantsDuration: 'Duration',
    plantsYield: 'Expected yield',
    plantsDifficulty: 'Difficulty',
    plantsMarket: 'Market price',
    plantsWaterNeed: 'Water need',
    plantsClimate: 'Climate',
    plantsRegion: 'Region',
    plantsSeasonShort: 'Season',
    plantsGenericError: 'Could not load plants.',
    diseaseTitle: 'Disease library',
    diseaseSubtitle: 'Search by crop, symptom, or disease name. Severity is color-coded for at-a-glance triage.',
    diseaseSearchPlaceholder: 'Search diseases, symptoms, or crops...',
    diseaseFilterAll: 'All',
    diseaseBackToList: 'Back to diseases',
    diseaseLoading: 'Loading disease details…',
    diseaseSymptoms: 'Symptoms',
    diseaseTreatment: 'Treatment',
    diseasePrevention: 'Prevention',
    diseaseGenericError: 'Could not load diseases.',
    calendarTitle: 'Growth calendar',
    calendarSubtitle: 'A month-by-month view of what each crop needs from you — land prep, sowing, vegetative growth, flowering, and harvest.',
    calendarFilterAll: 'All crops',
    calendarCropColumn: 'Crop',
    calendarLoading: 'Loading crop schedule…',
    calendarFootnote: 'Schedules are derived from each crop\'s catalog season and days-to-harvest. Always confirm with your local agronomist for region-specific adjustments.',
    calendarGenericError: 'Could not load the calendar.',
    videoTitle: 'Video hub',
    videoSubtitle: 'Watch practical farming tutorials, from planting to harvest.',
    videoSearchPlaceholder: 'Search videos by title, topic, or crop...',
    videoFilterAll: 'All topics',
    videoEmptyTitle: 'No videos match your search',
    videoEmptyBody: 'Try a different keyword or clear the filter to browse all tutorials.',
    videoLoading: 'Loading videos…',
    videoWatch: 'Watch video',
    videoClose: 'Close player',
    videoGenericError: 'Could not load videos.',
    feedbackTitle: 'Feedback',
    feedbackSubtitle: 'Help us improve FarmerAI. Tell us what worked, what broke, and what you would like next.',
    feedbackRecentTitle: 'Your recent feedback',
    feedbackCategory: 'Category',
    feedbackCategoryBug: 'Bug report',
    feedbackCategoryFeature: 'Feature request',
    feedbackCategoryGeneral: 'General',
    feedbackRating: 'Rating',
    feedbackMessage: 'Message',
    feedbackScreenshot: 'Screenshot (optional)',
    feedbackUploadCta: 'Click to attach a screenshot',
    feedbackUploadHint: 'JPG or PNG up to 10 MB',
    feedbackRemoveImage: 'Remove screenshot',
    feedbackSubmit: 'Send feedback',
    feedbackSubmitting: 'Sending…',
    feedbackSuccess: 'Thanks for your feedback!',
    feedbackNeedMessage: 'Please write a short message.',
    feedbackEmpty: 'No feedback yet. Your submissions will appear here.',
    feedbackLoading: 'Loading your feedback…',
    feedbackGenericError: 'Could not send feedback.',
    feedbackStatusOpen: 'Open',
    feedbackStatusInProgress: 'In progress',
    feedbackStatusResolved: 'Resolved',
    reportsTitle: 'Reports',
    reportsSubtitle: 'A quick look at how FarmerAI is working for you.',
    reportsExport: 'Export CSV',
    reportsExportSuccess: 'Report downloaded',
    reportsCropCount: 'Crops in catalog',
    reportsSoilCount: 'Soil predictions',
    reportsFeedbackCount: 'Feedback submissions',
    reportsChatCount: 'Chat messages',
    reportsLastCrop: 'Last viewed crop',
    reportsActivityTitle: 'Activity summary',
    reportsActivityBody: 'Your most recent crop research, soil readings, and feedback at a glance.',
    reportsLoading: 'Loading reports…',
    reportsGenericError: 'Could not load reports.',
    chatTitle: 'AI Assistant',
    chatSubtitle: 'Ask anything about your farm — crops, pests, soil, or seasons.',
    chatPlaceholder: 'Type your question…',
    chatSend: 'Send',
    chatClear: 'Clear chat',
    chatEmpty: 'Start the conversation. Ask about planting, pests, or anything else.',
    chatLoading: 'Assistant is typing…',
    chatCleared: 'Chat history cleared.',
    chatGenericError: 'Could not reach the assistant. Please try again.',
    chatYou: 'You',
    chatAssistant: 'Assistant',
    subscriptionTitle: 'Subscription',
    subscriptionSubtitle: 'Choose the plan that fits your farm. You can change anytime.',
    subscriptionCurrentPlan: 'Current plan',
    subscriptionFree: 'Free',
    subscriptionBasic: 'Basic',
    subscriptionPremium: 'Premium',
    subscriptionPrice: 'Price',
    subscriptionPerMonth: '/ month',
    subscriptionFeatures: 'Features',
    subscriptionSelectPlan: 'Select plan',
    subscriptionMockNotice: 'This is a demo — payments are coming soon.',
    subscriptionActive: 'Active',
    subscriptionExpiresAt: 'Expires',
    subscriptionGenericError: 'Could not load your subscription.',
    subscriptionLoading: 'Loading plans…',
    subFeatureFree1: 'Up to 8 crop recommendations',
    subFeatureFree2: 'Basic soil prediction',
    subFeatureFree3: 'Community support',
    subFeatureBasic1: 'Unlimited crop recommendations',
    subFeatureBasic2: 'Advanced soil analysis',
    subFeatureBasic3: 'Full disease library',
    subFeatureBasic4: 'Email support',
    subFeaturePremium1: 'Everything in Basic',
    subFeaturePremium2: 'AI chatbot assistant',
    subFeaturePremium3: 'Offline access',
    subFeaturePremium4: 'Priority support',
    subFeaturePremium5: 'Early access to new features',
    adminTitle: 'Admin dashboard',
    adminFeedback: 'Feedback',
    adminStatus: 'Status',
    adminNotes: 'Admin notes',
    adminUpdate: 'Update',
    adminUpdateSuccess: 'Feedback updated',
    adminFilterAll: 'All',
    adminFilterOpen: 'Open',
    adminFilterInProgress: 'In progress',
    adminFilterResolved: 'Resolved',
    adminUserName: 'User',
    adminCategory: 'Category',
    adminRating: 'Rating',
    adminMessage: 'Message',
    adminDate: 'Date',
    adminLoading: 'Loading feedback…',
    adminGenericError: 'Could not load feedback.',
    adminEmpty: 'No feedback matches this filter.',
    adminNoNotes: 'No admin notes yet.',
    adminExpand: 'View details',
    commonHigh: 'High',
    commonMedium: 'Medium',
    commonLow: 'Low',
    commonAll: 'All',
  },
  so: {
    brand: 'FarmerAI',
    searchPlaceholder: 'Raadi dalaje, cudur, casharro...',
    navDashboard: 'Dashboor',
    navCropRecommendation: 'Talo Dal',
    navSoilPrediction: 'Saadaalinta Ciidda',
    navPlantExplorer: 'Sahaminta Dhirta',
    navDiseaseLibrary: 'Maktabadda Cudurrada',
    navGrowthCalendar: 'Jadwalka Koritaanka',
    navVideoHub: 'Xarunta Fiidiyowga',
    navFeedback: 'Raʼyiga', // Raa'yiga — feedback / opinion
    navReports: 'Warbixinno',
    navSubscription: 'Diiwaan Gelinta',
    navAdmin: 'Maamul',
    topbarRole: 'Beerrey',
    mobileCrops: 'Dal',
    mobilePlants: 'Dhir',
    mobileCalendar: 'Jadwalka',
    mobileMore: 'Waxbadan',
    signOut: 'Ka bax',
    comingSoon: 'Waa iman doonaa',
    authTagline: 'Hagid AI oo loogu talagalay beer kasta',
    authSignInTitle: 'Soo dhawoow mar kale',
    authSignUpTitle: 'Sameyso astaantaada beeraha',
    authSignInSubtitle: 'Gali si aad u sii wadato dashboorkaaga.',
    authSignUpSubtitle: 'Laba tallaabo oo dhakhso ah. Waxaan u isticmaalnaa talooyinka kuu habboon.',
    authName: 'Magaca oo buuxa',
    authEmail: 'Iimayl',
    authPassword: 'Furaha sirta ah',
    authConfirmPassword: 'Xaqiiji furaha',
    authRegion: 'Gobol ama degmo',
    authRegionPlaceholder: 'tusaale. Punjab, Kano, Gharb Darfur',
    authLandSize: 'Cabbirka dhulka (eekar)',
    authLandSizePlaceholder: 'ikhtiyaar',
    authFarmType: 'Nooca beeraha',
    authFarmTypeSubsistence: 'Nafaada',
    authFarmTypeCommercial: 'Ganacsi',
    authFarmTypeMixed: 'Isku dhafan',
    authFarmTypeOrganic: 'Dabiici ah',
    authLanguage: 'Luuqad',
    authNext: 'Xiga',
    authBack: 'Dib',
    authCreateAccount: 'Sameyso akoon',
    authSignIn: 'Gali',
    authSignInCta: 'Gali',
    authSignUpCta: 'Diiwaan geli',
    authHaveAccount: 'Horey ayey kuu haysatay akoon?',
    authNoAccount: 'Kuw cusub FarmerAI?',
    authStepAccount: 'Akoon',
    authStepFarm: 'Beero',
    authStepDone: 'Dhammaad',
    authSuccess: 'Akoonkaaga waa diyaar yahay. Waan soo dejinaynaa dashboorkaaga…',
    authInvalidEmail: 'Fadlan geli iimayl sax ah.',
    authPasswordTooShort: 'Furaha waa inuu ahaadaa ugu yaraan 8 xaraf.',
    authPasswordMismatch: 'Furayaasha sirta ah isma waafaqaan.',
    authGenericError: 'Wax baa khaldamay. Fadlan mar kale isku day.',
    authLanguageEn: 'Ingiriis',
    authLanguageSo: 'Soomaali',
    authLanguageAr: 'Carabi',
    authMarketingTitle: 'Beer wanaagsan halkan ka bilaabmaa',
    authMarketingBody: 'Talo dal oo shakhsi ah, falanqayn ciid, iyo maktabad beer oo dhameystiran — meel keliya.',
    authMarketingPoint1: 'Loo habeeyay gobolkaaga iyo ciiddaada',
    authMarketingPoint2: 'EN, SO, AR oo leh taageero RTL',
    authMarketingPoint3: 'Shaqo markii aad gasho',
    landingHeroEyebrow: 'Beer wanaagsan oo loogu talagalay dhul kasta',
    landingHeroTitle: 'Ku kor wax badan oo ku saabsan FarmerAI',
    landingHeroBody: 'Talooyin dal, falanqayn ciid, ogaanshaha cudurrada iyo la socoshada koritaanka — ku habboon beerahayaga iyo gobolkaaga.',
    landingPrimaryCta: 'Bilow',
    landingSecondaryCta: 'Gali',
    landingTrustBadge: 'Loo dhisay beer-yaqaannada. Waxaa kor mariya AI.',
    landingQuickActionsTitle: 'Xaggee ka bilaabi kartaa?',
    landingQuickActionsBody: 'Shan badhamood oo loo fududeeyay beerayaasha. Wax kale waxay ku jiraan sidebar.',
    landingQuickActionDashboard: 'Dashboor',
    landingQuickActionDashboardDesc: 'Cimilada maanta, hawlaha, iyo talo degdeg ah.',
    landingQuickActionCrops: 'Talo dal',
    landingQuickActionCropsDesc: 'Dooro dal, hel talo shakhsi ah.',
    landingQuickActionSoil: 'Falanqayn ciid',
    landingQuickActionSoilDesc: 'Soo geli sawir, akhri xaaladda.',
    landingQuickActionPlants: 'Sahaminta dhirta',
    landingQuickActionPlantsDesc: 'Sahamin katalogga oo dhan.',
    landingQuickActionDiseases: 'Maktabadda cudurrada',
    landingQuickActionDiseasesDesc: 'Aqso calaamadaha iyo daawaynta.',
    landingFeature1Title: 'Talo ku saleysan gobolka',
    landingFeature1Body: 'Talooyinku waxay ixtiraamaan degmadaada, nooca ciidda iyo luqadda.',
    landingFeature2Title: 'Luuqad labanlaab ah, RTL',
    landingFeature2Body: 'Ingiriis, Soomaali, Carabi oo leh taageero buuxda oo RTL.',
    landingFeature3Title: 'Waxay ka shaqeysaa xiriirka daciifka',
    landingFeature3Body: 'Loo dhisay xiriir miyiga ah — khafiif, saaxiibtinimo xiriir.',
    landingFeature4Title: 'Xogtaadu waa kuu gaar ah',
    landingFeature4Body: 'Lama xisaabinayo saddexaad; kaliya waxa loo baahan yahay talo.',
    landingFooter: '© 2026 FarmerAI — loo dhisay beerayaasha, la beerayaasha.',
    landingSignIn: 'Gali',
    landingGetStarted: 'Bilow',
    dashGreetingMorning: 'Subax wanaagsan',
    dashGreetingAfternoon: 'Galab wanaagsan',
    dashGreetingEvening: 'Fiid wanaagsan',
    dashSubtitle: 'Waa tan waxa maanta ku socda beerahayaga.',
    dashWeatherTitle: 'Cimilada maanta',
    dashWeatherBody: 'Xaalad wanaagsan. Maalin fiican oo aad ku baarto beerahaaga.',
    dashWeatherHumidity: 'Qoyaan',
    dashWeatherWind: 'Dabayl',
    dashWeatherRain: 'Fursad roob',
    dashStatCrops: 'Dal ku jira katalogga',
    dashStatCropsHint: 'loo habeeyay gobolkaaga',
    dashStatLand: 'Dhul la soconayo',
    dashStatLandHint: 'guud ahaan beerahayga',
    dashStatLanguages: 'Luuqadaha',
    dashStatLanguagesHint: 'EN · SO · AR',
    dashStatSoil: 'Falanqaynta ciidda',
    dashStatSoilHint: 'soo geli sawir si aad u akhrido',
    dashRecentTitle: 'Talooyin dhawaa',
    dashRecentBody: 'Arag dalaje aad dhawaan weydiisay.',
    dashRecentEmpty: 'Weli talo la\'ma haysto. Dooro dal si aad u hesho taladaada koowaad.',
    dashRecentViewAll: 'Sahamin dhammaan dalaje',
    dashQuickActionsTitle: 'Xaggee xiga?',
    dashQuickActionsBody: 'Afar badhamood oo hal-tan ah.',
    dashActionGetAdvice: 'Hel talo dal',
    dashActionGetAdviceDesc: 'Dooro dal, hel talo beerid.',
    dashActionSoil: 'Saadaalinta ciidda',
    dashActionSoilDesc: 'Soo geli sawir ciid si aad u hesho natiijada.',
    dashActionDisease: 'Maktabadda cudurrada',
    dashActionDiseaseDesc: 'Aqso calaamadaha iyo daawaynta.',
    dashActionChatbot: 'Weydii chatbot',
    dashActionChatbotDesc: 'Hel jawaab degdeg ah luuqadda caadiga ah.',
    dashTipTitle: 'Talo maanta',
    dashTipBody: 'Socoshada beeraha ka hor subaxnimada dhexe. Waxaad arkidooda cayayaanka, dhibaatooyinka nafaqada, iyo qoyaan kahor inta aanay kulul noqonin.',
    cropTitle: 'Talo dal',
    cropSubtitle: 'Dooro dal si aad u hesho talo beerid, waraabinno, iyo bacrimin.',
    cropSearchPlaceholder: 'Raadi dalaje...',
    cropFilterAll: 'Dhammaan',
    cropFilterCereals: 'Cereals',
    cropFilterVegetables: 'Khudradda',
    cropFilterCash: 'Lacagta dal',
    cropFilterOilseeds: 'Saliidda',
    cropEmptyTitle: 'Ma jiro dal u dhigma raadinta',
    cropEmptyBody: 'Isku day eray kale ama nadiifi shaandhada si aad u aragto 8 dal.',
    cropBackToList: 'Ku noqo dalaje',
    cropSeason: 'Xilli',
    cropDaysToHarvest: 'Maalmaha ilaa gaa',
    cropPlantingMethod: 'Habka beeridda',
    cropIrrigation: 'Waraabinno',
    cropFertilizer: 'Bacrimin',
    cropCommonPests: 'Cayayaanka caadiga ah',
    cropAdviceTitle: 'Talo',
    cropAdviceLoading: 'Waa la diyaarinayaa talooyinkaaga…',
    cropAdviceAiBadge: 'AI',
    cropAdviceTemplateBadge: 'Katalogga',
    cropAdviceRefresh: 'Cusbooneysii talo',
    cropAdviceEmpty: 'Dooro dal si aad u aragto talada halkan.',
    cropAdviceError: 'Talo lama soo gelin karo. Fadlan mar kale isku day.',
    cropGetAdvice: 'Hel talo',
    cropViewDetails: 'Faahfaahin',
    soilTitle: 'Saadaalinta ciidda',
    soilSubtitle: 'Soo geli sawirka ciidda iyo wax akhris ah oo aad haysato. Waxaan ku siin doonnaa nooca ciidda iyo talooyin wax ku ool ah.',
    soilFormTitle: 'Gudbi muunad',
    soilImage: 'Sawirka ciidda',
    soilClearImage: 'Ka saar sawirka',
    soilUploadCta: 'Guji si aad u soo geliso sawirka ciidda',
    soilUploadHint: 'JPG ama PNG ilaa 10 MB',
    soilType: 'Nooca ciidda (ikhtiyaar)',
    soilTypePlaceholder: 'Dooro nooc ciid',
    soilPh: 'pH',
    soilNitrogen: 'Nitrogen',
    soilPhosphorus: 'Phosphorus',
    soilPotassium: 'Potassium',
    soilOrganicMatter: 'Walxaha organic',
    soilSalinity: 'Milix',
    soilSubmit: 'Falanqee ciidda',
    soilSubmitting: 'Waa la falanqeynayaa…',
    soilSuccess: 'Ciidda waa la falanqeeyay',
    soilNeedImage: 'Sawirka ciidda waa loo baahan yahay.',
    soilGenericError: 'Ciidda lama falanqeyn karo.',
    soilResultLabel: 'Nooca la saadaaliyay',
    soilConfidence: 'Aaminaad',
    soilRecommendations: 'Talooyin',
    soilHistoryTitle: 'Gudbinnadii hore',
    soilHistoryEmpty: 'Wali gudbin ma jiraan.',
    soilLoading: 'Waa la soo dejinayaa…',
    plantsTitle: 'Sahaminta dhirta',
    plantsSubtitle: 'Sahaminta katalogga la xaqiijiyay. Dooro dhir kasta si aad u hesho faahfaahinta beeridda, cayayaanka, iyo khayraadka.',
    plantsSearchPlaceholder: 'Raadi dhirta magaceeda, cilmiga, ama sharaxaadda...',
    plantsFilterAll: 'Dhammaan',
    plantsResultCount: 'dhir',
    plantsBackToList: 'Ku noqo dhirta',
    plantsLoading: 'Waa la soo dejinayaa faahfaahinta dhirta…',
    plantsOverview: 'Guud',
    plantsAgronomy: 'Beeridda',
    plantsPests: 'Cayayaanka caadiga ah',
    plantsResources: 'Khayraadka waxbarasho',
    plantsEmpty: 'Halkan wax ma jiraan.',
    plantsDuration: 'Muddada',
    plantsYield: 'Soo saaridda la filayo',
    plantsDifficulty: 'Dhib',
    plantsMarket: 'Qiimaha suuqa',
    plantsWaterNeed: 'Baahida biyaha',
    plantsClimate: 'Cimilada',
    plantsRegion: 'Gobolka',
    plantsSeasonShort: 'Xilli',
    plantsGenericError: 'Dhirta lama soo gelin karo.',
    diseaseTitle: 'Maktabadda cudurrada',
    diseaseSubtitle: 'Ku raadi dal, calaamad, ama magaca cudurka.',
    diseaseSearchPlaceholder: 'Raadi cudurrada, calaamadaha, ama dalaje...',
    diseaseFilterAll: 'Dhammaan',
    diseaseBackToList: 'Ku noqo cudurrada',
    diseaseLoading: 'Waa la soo dejinayaa faahfaahinta cudurka…',
    diseaseSymptoms: 'Calaamadaha',
    diseaseTreatment: 'Daawaynta',
    diseasePrevention: 'Ka hortagga',
    diseaseGenericError: 'Cudurrada lama soo gelin karo.',
    calendarTitle: 'Jadwalka koritaanka',
    calendarSubtitle: 'Aragida bisha-bisha ah ee waxa dal kasta ku baahan yahay.',
    calendarFilterAll: 'Dhammaan dalaje',
    calendarCropColumn: 'Dal',
    calendarLoading: 'Waa la soo dejinayaa jadwalka dal…',
    calendarFootnote: 'Jadwalku wuxuu ku saleysan yahay xilliga dal iyo maalmaha gaa. Had iyo jeer xaqiiji la-taliyahaaga degaanka.',
    calendarGenericError: 'Jadwalka lama soo gelin karo.',
    videoTitle: 'Xarunta fiidiyowga',
    videoSubtitle: 'Daawato casharro beerasho oo wax ku ool ah, laga bilaabo beeridda ilaa gaa.',
    videoSearchPlaceholder: 'Raadi fiidiyowga cinwaanka, mawduuca, ama dal...',
    videoFilterAll: 'Dhammaan mawduucyada',
    videoEmptyTitle: 'Ma jiro fiidiyow u dhigma raadinta',
    videoEmptyBody: 'Isku day eray kale ama nadiifi shaandhada si aad u daawato casharro.',
    videoLoading: 'Waa la soo dejinayaa fiidiyowga…',
    videoWatch: 'Daawashada fiidiyowga',
    videoClose: 'Xir cayaare',
    videoGenericError: 'Fiidiyowga lama soo gelin karo.',
    feedbackTitle: 'Raʼyiga',
    feedbackSubtitle: 'Naga caawi horumarinta FarmerAI. Noo sheeg waxa shaqeeyay, waxa jabay, iyo waxa aad rabto.',
    feedbackRecentTitle: 'Raʼyigaagii hore',
    feedbackCategory: 'Qaybta',
    feedbackCategoryBug: 'Warbixin qalad',
    feedbackCategoryFeature: 'Codsiga astaanta',
    feedbackCategoryGeneral: 'Guud',
    feedbackRating: 'Qiimaynta',
    feedbackMessage: 'Fariinta',
    feedbackScreenshot: 'Sawir (ikhtiyaar)',
    feedbackUploadCta: 'Guji si aad u soo geliso sawir',
    feedbackUploadHint: 'JPG ama PNG ilaa 10 MB',
    feedbackRemoveImage: 'Ka saar sawirka',
    feedbackSubmit: 'Dir raʼyiga',
    feedbackSubmitting: 'Waa la dirayaa…',
    feedbackSuccess: 'Waad ku mahadsan tahay raʼyigaaga!',
    feedbackNeedMessage: 'Fadlan qor fariin gaaban.',
    feedbackEmpty: 'Wali raʼyi ma jiro. Raʼyigaagu wuxuu halkan ka soo bixi doonaa.',
    feedbackLoading: 'Waa la soo dejinayaa raʼyigaaga…',
    feedbackGenericError: 'Raʼyiga lama diri karo.',
    feedbackStatusOpen: 'Furan',
    feedbackStatusInProgress: 'Hawl socota',
    feedbackStatusResolved: 'La xalliyay',
    reportsTitle: 'Warbixinno',
    reportsSubtitle: 'Arag sida FarmerAI kuugu shaqaynayo.',
    reportsExport: 'Soo deji CSV',
    reportsExportSuccess: 'Warbixinta waa la soo dejiyay',
    reportsCropCount: 'Dal ku jira katalogga',
    reportsSoilCount: 'Saadaalinta ciidda',
    reportsFeedbackCount: 'Raʼyiga la soo diray',
    reportsChatCount: 'Fariimaha wada sheekaysiga',
    reportsLastCrop: 'Dal markii ugu dambeysay la daawaday',
    reportsActivityTitle: 'Soo koobida hawlaha',
    reportsActivityBody: 'Cilmi-baarista dhawaa, akhriska ciidda, iyo raʼyiga.',
    reportsLoading: 'Waa la soo dejinayaa warbixinnada…',
    reportsGenericError: 'Warbixinno lama soo gelin karo.',
    chatTitle: 'Kaaliyaha AI',
    chatSubtitle: 'Is weydii wax kasta oo ku saabsan beerahaaga — dal, cayayaan, ciid, ama xilliyo.',
    chatPlaceholder: 'Qor suʼaashaada…',
    chatSend: 'Dir',
    chatClear: 'Nadiifi wada sheekaysiga',
    chatEmpty: 'Bilow wada sheekaysiga. Is weydii beeridda, cayayaanka, ama wax kale.',
    chatLoading: 'Kaaliyuhu wuu qorayaa…',
    chatCleared: 'Wada sheekaysigii waa la nadiifiyay.',
    chatGenericError: 'Kaaliyaha lama gaari karo. Fadlan mar kale isku day.',
    chatYou: 'Adiga',
    chatAssistant: 'Kaaliye',
    subscriptionTitle: 'Diiwaan gelinta',
    subscriptionSubtitle: 'Dooro qorshaha ku habboon beerahaaga. Waxaad badali kartaa wakhti kasta.',
    subscriptionCurrentPlan: 'Qorshaha hadda',
    subscriptionFree: 'Bilaash',
    subscriptionBasic: 'Aasaasi',
    subscriptionPremium: 'Gaar ah',
    subscriptionPrice: 'Qiimaha',
    subscriptionPerMonth: '/ bishii',
    subscriptionFeatures: 'Astaamaha',
    subscriptionSelectPlan: 'Dooro qorshaha',
    subscriptionMockNotice: 'Kani waa tijaabo — lacag-bixinta waa iman doontaa dhawaan.',
    subscriptionActive: 'Hawlgal',
    subscriptionExpiresAt: 'Dhamaada',
    subscriptionGenericError: 'Diiwaanka lama soo gelin karo.',
    subscriptionLoading: 'Waa la soo dejinayaa qorshayaasha…',
    subFeatureFree1: 'Ilaa 8 talo dal',
    subFeatureFree2: 'Saadaalinta ciidda aasaasiga ah',
    subFeatureFree3: 'Taageerada bulshada',
    subFeatureBasic1: 'Talooyin dal aan xad lahayn',
    subFeatureBasic2: 'Falanqaynta ciidda sare',
    subFeatureBasic3: 'Maktabadda cudurrada oo dhameystiran',
    subFeatureBasic4: 'Taageerada iimaylka',
    subFeaturePremium1: 'Dhammaan Aasaasiga',
    subFeaturePremium2: 'Kaaliyaha chatbot AI',
    subFeaturePremium3: 'Shaqo marka aad ka baxdo internetka',
    subFeaturePremium4: 'Taageero mudnaan leh',
    subFeaturePremium5: 'Helitaanka astaamaha cusub ee hore',
    adminTitle: 'Dashborka maamulka',
    adminFeedback: 'Raʼyiga',
    adminStatus: 'Xaalad',
    adminNotes: 'Fiirada maamulka',
    adminUpdate: 'Cusbooneysii',
    adminUpdateSuccess: 'Raʼyiga waa la cusbooneysiiyay',
    adminFilterAll: 'Dhammaan',
    adminFilterOpen: 'Furan',
    adminFilterInProgress: 'Hawl socota',
    adminFilterResolved: 'La xalliyay',
    adminUserName: 'Isticmaale',
    adminCategory: 'Qaybta',
    adminRating: 'Qiimaynta',
    adminMessage: 'Fariinta',
    adminDate: 'Taariikh',
    adminLoading: 'Waa la soo dejinayaa raʼyiga…',
    adminGenericError: 'Raʼyiga lama soo gelin karo.',
    adminEmpty: 'Ma jiro raʼyi u dhigma shaandhadaan.',
    adminNoNotes: 'Weli fiirada maamulka ma jiraan.',
    adminExpand: 'Faahfaahin',
    commonHigh: 'Sare',
    commonMedium: 'Dhexe',
    commonLow: 'Hoose',
    commonAll: 'Dhammaan',
  },
  ar: {
    brand: 'FarmerAI',
    searchPlaceholder: 'ابحث عن المحاصيل والأمراض والدروس...',
    navDashboard: 'لوحة التحكم',
    navCropRecommendation: 'توصية المحصول',
    navSoilPrediction: 'توقع التربة',
    navPlantExplorer: 'مستكشف النباتات',
    navDiseaseLibrary: 'مكتبة الأمراض',
    navGrowthCalendar: 'تقويم النمو',
    navVideoHub: 'مركز الفيديو',
    navFeedback: 'الملاحظات',
    navReports: 'التقارير',
    navSubscription: 'الاشتراك',
    navAdmin: 'الإدارة',
    topbarRole: 'مزارع',
    mobileCrops: 'محاصيل',
    mobilePlants: 'نباتات',
    mobileCalendar: 'التقويم',
    mobileMore: 'المزيد',
    signOut: 'تسجيل خروج',
    comingSoon: 'قريباً',
    authTagline: 'إرشاد مدعوم بالذكاء الاصطناعي لكل مزارع',
    authSignInTitle: 'مرحباً بعودتك',
    authSignUpTitle: 'أنشئ ملف مزرعتك',
    authSignInSubtitle: 'سجّل الدخول للمتابعة إلى لوحة التحكم.',
    authSignUpSubtitle: 'خطوتان سريعتان. نستخدم هذا لتخصيص توصياتك.',
    authName: 'الاسم الكامل',
    authEmail: 'البريد الإلكتروني',
    authPassword: 'كلمة المرور',
    authConfirmPassword: 'تأكيد كلمة المرور',
    authRegion: 'المنطقة أو المقاطعة',
    authRegionPlaceholder: 'مثال: البنجاب، كانو، غرب دارفور',
    authLandSize: 'مساحة الأرض (فدان)',
    authLandSizePlaceholder: 'اختياري',
    authFarmType: 'نوع المزرعة',
    authFarmTypeSubsistence: 'معيشية',
    authFarmTypeCommercial: 'تجارية',
    authFarmTypeMixed: 'مختلطة',
    authFarmTypeOrganic: 'عضوية',
    authLanguage: 'اللغة',
    authNext: 'التالي',
    authBack: 'رجوع',
    authCreateAccount: 'إنشاء حساب',
    authSignIn: 'تسجيل الدخول',
    authSignInCta: 'تسجيل الدخول',
    authSignUpCta: 'إنشاء حساب',
    authHaveAccount: 'لديك حساب بالفعل؟',
    authNoAccount: 'جديد على FarmerAI؟',
    authStepAccount: 'الحساب',
    authStepFarm: 'المزرعة',
    authStepDone: 'تم',
    authSuccess: 'حسابك جاهز. يتم تحميل لوحة التحكم…',
    authInvalidEmail: 'يرجى إدخال بريد إلكتروني صالح.',
    authPasswordTooShort: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
    authPasswordMismatch: 'كلمتا المرور غير متطابقتين.',
    authGenericError: 'حدث خطأ ما. حاول مرة أخرى.',
    authLanguageEn: 'الإنجليزية',
    authLanguageSo: 'الصومالية',
    authLanguageAr: 'العربية',
    authMarketingTitle: 'الزراعة الذكية تبدأ هنا',
    authMarketingBody: 'توصيات مخصصة للمحاصيل، ورؤى التربة، ومكتبة زراعية كاملة — في مكان واحد.',
    authMarketingPoint1: 'مخصصة لمنطقتك وتربتك',
    authMarketingPoint2: 'EN، SO، AR مع دعم كامل من اليمين لليسار',
    authMarketingPoint3: 'يعمل دون اتصال بعد تسجيل الدخول',
    landingHeroEyebrow: 'زراعة ذكية لكل حقل',
    landingHeroTitle: 'انمُ بشكل أذكى مع FarmerAI',
    landingHeroBody: 'توصيات للمحاصيل، ورؤى حول التربة، وكشف الأمراض، وتتبع النمو — مصممة لمزرعتك ومنطقتك.',
    landingPrimaryCta: 'ابدأ الآن',
    landingSecondaryCta: 'تسجيل الدخول',
    landingTrustBadge: 'بُنيت مع المهندسين الزراعيين. مدعومة بـ Claude.',
    landingQuickActionsTitle: 'من أين تريد أن تبدأ؟',
    landingQuickActionsBody: 'خمس اختصارات لأهم الشاشات. الباقي في الشريط الجانبي.',
    landingQuickActionDashboard: 'لوحة التحكم',
    landingQuickActionDashboardDesc: 'طقس اليوم، المهام، ونصيحة سريعة.',
    landingQuickActionCrops: 'نصيحة المحاصيل',
    landingQuickActionCropsDesc: 'اختر محصولًا واحصل على نصيحة.',
    landingQuickActionSoil: 'رؤى التربة',
    landingQuickActionSoilDesc: 'حمّل صورة واقرأ حالتها.',
    landingQuickActionPlants: 'مستكشف النباتات',
    landingQuickActionPlantsDesc: 'تصفح الكتالوج الكامل.',
    landingQuickActionDiseases: 'مكتبة الأمراض',
    landingQuickActionDiseasesDesc: 'حدد الأعراض والعلاجات.',
    landingFeature1Title: 'نصائح مخصصة للمنطقة',
    landingFeature1Body: 'التوصيات تراعي منطقتك ونوع تربتك ولغتك.',
    landingFeature2Title: 'لغات متعددة مع دعم RTL',
    landingFeature2Body: 'إنجليزية وصومالية وعربية مع دعم كامل من اليمين لليسار.',
    landingFeature3Title: 'تعمل على الروابط البطيئة',
    landingFeature3Body: 'مصممة لاتصالات الريف — خفيفة على البيانات.',
    landingFeature4Title: 'بياناتك تبقى ملكك',
    landingFeature4Body: 'لا تحليلات لطرف ثالث؛ الحد الأدنى فقط لتخصيص النصيحة.',
    landingFooter: '© 2026 FarmerAI — بُني للمزارعين، مع المزارعين.',
    landingSignIn: 'تسجيل الدخول',
    landingGetStarted: 'ابدأ الآن',
    dashGreetingMorning: 'صباح الخير',
    dashGreetingAfternoon: 'مساء الخير',
    dashGreetingEvening: 'مساء الخير',
    dashSubtitle: 'إليك ما يحدث في مزرعتك اليوم.',
    dashWeatherTitle: 'طقس اليوم',
    dashWeatherBody: 'أجواء لطيفة. يوم جيد لتفقد حقولك.',
    dashWeatherHumidity: 'الرطوبة',
    dashWeatherWind: 'الرياح',
    dashWeatherRain: 'فرصة المطر',
    dashStatCrops: 'محاصيل في الكتالوج',
    dashStatCropsHint: 'مخصصة لمنطقتك',
    dashStatLand: 'الأرض المتعقبة',
    dashStatLandHint: 'في ملف المزرعة',
    dashStatLanguages: 'اللغات',
    dashStatLanguagesHint: 'EN · SO · AR',
    dashStatSoil: 'رؤى التربة',
    dashStatSoilHint: 'حمّل صورة لقراءتها',
    dashRecentTitle: 'نصائح حديثة',
    dashRecentBody: 'نظرة سريعة على آخر المحاصيل التي سألت عنها.',
    dashRecentEmpty: 'لا نصائح بعد. اختر محصولًا للحصول على أول توصية.',
    dashRecentViewAll: 'تصفح جميع المحاصيل',
    dashQuickActionsTitle: 'إلى أين بعد ذلك؟',
    dashQuickActionsBody: 'أربعة اختصارات بنقرة واحدة.',
    dashActionGetAdvice: 'احصل على نصيحة',
    dashActionGetAdviceDesc: 'اختر محصولًا واحصل على إرشاد مخصص.',
    dashActionSoil: 'توقع التربة',
    dashActionSoilDesc: 'حمّل صورة تربة للحصول على قراءة فورية.',
    dashActionDisease: 'مكتبة الأمراض',
    dashActionDiseaseDesc: 'حدد الأعراض والعلاجات.',
    dashActionChatbot: 'اسأل المساعد',
    dashActionChatbotDesc: 'احصل على إجابة سريعة بلغة بسيطة.',
    dashTipTitle: 'نصيحة اليوم',
    dashTipBody: 'تجوّل في حقولك قبل منتصف الصباح. ستكتشف الآفات ومشاكل المغذيات والرطوبة قبل أن تتفاقم.',
    cropTitle: 'توصية المحصول',
    cropSubtitle: 'اختر محصولًا للحصول على نصيحة مخصصة للزراعة والري والتسميد.',
    cropSearchPlaceholder: 'ابحث عن المحاصيل...',
    cropFilterAll: 'الكل',
    cropFilterCereals: 'الحبوب',
    cropFilterVegetables: 'الخضروات',
    cropFilterCash: 'محاصيل نقدية',
    cropFilterOilseeds: 'البذور الزيتية',
    cropEmptyTitle: 'لا توجد محاصيل مطابقة',
    cropEmptyBody: 'جرّب كلمة مختلفة أو امسح الفلتر لرؤية جميع المحاصيل.',
    cropBackToList: 'العودة إلى المحاصيل',
    cropSeason: 'الموسم',
    cropDaysToHarvest: 'أيام حتى الحصاد',
    cropPlantingMethod: 'طريقة الزراعة',
    cropIrrigation: 'الري',
    cropFertilizer: 'التسميد',
    cropCommonPests: 'الآفات الشائعة',
    cropAdviceTitle: 'التوصية',
    cropAdviceLoading: 'جاري إنشاء التوصية…',
    cropAdviceAiBadge: 'مولّد بالذكاء الاصطناعي',
    cropAdviceTemplateBadge: 'من الكتالوج',
    cropAdviceRefresh: 'تحديث النصيحة',
    cropAdviceEmpty: 'اختر محصولًا من الشبكة لرؤية توصيته هنا.',
    cropAdviceError: 'تعذر تحميل النصيحة. حاول مرة أخرى.',
    cropGetAdvice: 'احصل على نصيحة',
    cropViewDetails: 'التفاصيل',
    soilTitle: 'توقع التربة',
    soilSubtitle: 'حمّل صورة تربة وأي قراءات لديك. سنرجع لك تخمينًا لنوع التربة وتوصيات عملية.',
    soilFormTitle: 'أرسل عينة',
    soilImage: 'صورة التربة',
    soilClearImage: 'إزالة الصورة',
    soilUploadCta: 'انقر لرفع صورة التربة',
    soilUploadHint: 'JPG أو PNG حتى 10 ميجابايت',
    soilType: 'نوع التربة (اختياري)',
    soilTypePlaceholder: 'اختر نوع التربة',
    soilPh: 'الرقم الهيدروجيني',
    soilNitrogen: 'النيتروجين',
    soilPhosphorus: 'الفوسفور',
    soilPotassium: 'البوتاسيوم',
    soilOrganicMatter: 'المادة العضوية',
    soilSalinity: 'الملوحة',
    soilSubmit: 'تحليل التربة',
    soilSubmitting: 'جاري التحليل…',
    soilSuccess: 'تم تحليل التربة',
    soilNeedImage: 'صورة التربة مطلوبة.',
    soilGenericError: 'تعذر تحليل التربة.',
    soilResultLabel: 'نوع التربة المتوقع',
    soilConfidence: 'الثقة',
    soilRecommendations: 'التوصيات',
    soilHistoryTitle: 'الإرساليات السابقة',
    soilHistoryEmpty: 'لا توجد إرساليات بعد.',
    soilLoading: 'جاري تحميل الإرساليات…',
    plantsTitle: 'مستكشف النباتات',
    plantsSubtitle: 'تصفح الكتالوج الموثق. انقر على أي نبات للحصول على تفاصيل الزراعة والآفات والموارد.',
    plantsSearchPlaceholder: 'ابحث بالاسم أو الاسم العلمي أو الوصف...',
    plantsFilterAll: 'الكل',
    plantsResultCount: 'نباتات',
    plantsBackToList: 'العودة إلى النباتات',
    plantsLoading: 'جاري تحميل التفاصيل…',
    plantsOverview: 'نظرة عامة',
    plantsAgronomy: 'الزراعة',
    plantsPests: 'الآفات الشائعة',
    plantsResources: 'موارد التعلم',
    plantsEmpty: 'لا يوجد شيء هنا.',
    plantsDuration: 'المدة',
    plantsYield: 'الإنتاج المتوقع',
    plantsDifficulty: 'الصعوبة',
    plantsMarket: 'سعر السوق',
    plantsWaterNeed: 'حاجة الماء',
    plantsClimate: 'المناخ',
    plantsRegion: 'المنطقة',
    plantsSeasonShort: 'الموسم',
    plantsGenericError: 'تعذر تحميل النباتات.',
    diseaseTitle: 'مكتبة الأمراض',
    diseaseSubtitle: 'ابحث بالمحصول أو العرض أو اسم المرض.',
    diseaseSearchPlaceholder: 'ابحث عن الأمراض أو الأعراض...',
    diseaseFilterAll: 'الكل',
    diseaseBackToList: 'العودة إلى الأمراض',
    diseaseLoading: 'جاري تحميل تفاصيل المرض…',
    diseaseSymptoms: 'الأعراض',
    diseaseTreatment: 'العلاج',
    diseasePrevention: 'الوقاية',
    diseaseGenericError: 'تعذر تحميل الأمراض.',
    calendarTitle: 'تقويم النمو',
    calendarSubtitle: 'عرض شهري لاحتياجات كل محصول.',
    calendarFilterAll: 'كل المحاصيل',
    calendarCropColumn: 'المحصول',
    calendarLoading: 'جاري تحميل الجدول…',
    calendarFootnote: 'الجدول مشتق من موسم المحصول وأيام الحصاد. تحقق دائمًا مع المهندس الزراعي لمنطقتك.',
    calendarGenericError: 'تعذر تحميل التقويم.',
    videoTitle: 'مركز الفيديو',
    videoSubtitle: 'شاهد دروس الزراعة العملية، من الزراعة إلى الحصاد.',
    videoSearchPlaceholder: 'ابحث عن الفيديوهات بالعنوان أو الموضوع أو المحصول...',
    videoFilterAll: 'كل المواضيع',
    videoEmptyTitle: 'لا توجد فيديوهات مطابقة',
    videoEmptyBody: 'جرّب كلمة مختلفة أو امسح الفلتر لتصفح كل الدروس.',
    videoLoading: 'جاري تحميل الفيديوهات…',
    videoWatch: 'مشاهدة الفيديو',
    videoClose: 'إغلاق المشغل',
    videoGenericError: 'تعذر تحميل الفيديوهات.',
    feedbackTitle: 'الملاحظات',
    feedbackSubtitle: 'ساعدنا في تحسين FarmerAI. أخبرنا بما نجح وما تعطل وما تريده لاحقًا.',
    feedbackRecentTitle: 'ملاحظاتك السابقة',
    feedbackCategory: 'الفئة',
    feedbackCategoryBug: 'الإبلاغ عن خطأ',
    feedbackCategoryFeature: 'طلب ميزة',
    feedbackCategoryGeneral: 'عام',
    feedbackRating: 'التقييم',
    feedbackMessage: 'الرسالة',
    feedbackScreenshot: 'لقطة شاشة (اختياري)',
    feedbackUploadCta: 'انقر لإرفاق لقطة شاشة',
    feedbackUploadHint: 'JPG أو PNG حتى 10 ميجابايت',
    feedbackRemoveImage: 'إزالة لقطة الشاشة',
    feedbackSubmit: 'إرسال الملاحظة',
    feedbackSubmitting: 'جاري الإرسال…',
    feedbackSuccess: 'شكرًا لملاحظاتك!',
    feedbackNeedMessage: 'يرجى كتابة رسالة قصيرة.',
    feedbackEmpty: 'لا توجد ملاحظات بعد. ستظهر إرسالاتك هنا.',
    feedbackLoading: 'جاري تحميل ملاحظاتك…',
    feedbackGenericError: 'تعذر إرسال الملاحظة.',
    feedbackStatusOpen: 'مفتوحة',
    feedbackStatusInProgress: 'قيد المعالجة',
    feedbackStatusResolved: 'تم الحل',
    reportsTitle: 'التقارير',
    reportsSubtitle: 'نظرة سريعة على كيفية عمل FarmerAI من أجلك.',
    reportsExport: 'تصدير CSV',
    reportsExportSuccess: 'تم تنزيل التقرير',
    reportsCropCount: 'محاصيل في الكتالوج',
    reportsSoilCount: 'توقعات التربة',
    reportsFeedbackCount: 'ملاحظات مرسلة',
    reportsChatCount: 'رسائل المحادثة',
    reportsLastCrop: 'آخر محصول تم عرضه',
    reportsActivityTitle: 'ملخص النشاط',
    reportsActivityBody: 'أحدث أبحاثك عن المحاصيل وقراءات التربة والملاحظات في لمحة.',
    reportsLoading: 'جاري تحميل التقارير…',
    reportsGenericError: 'تعذر تحميل التقارير.',
    chatTitle: 'المساعد الذكي',
    chatSubtitle: 'اسأل أي شيء عن مزرعتك — المحاصيل أو الآفات أو التربة أو المواسم.',
    chatPlaceholder: 'اكتب سؤالك…',
    chatSend: 'إرسال',
    chatClear: 'مسح المحادثة',
    chatEmpty: 'ابدأ المحادثة. اسأل عن الزراعة أو الآفات أو أي شيء آخر.',
    chatLoading: 'المساعد يكتب…',
    chatCleared: 'تم مسح سجل المحادثة.',
    chatGenericError: 'تعذر الوصول إلى المساعد. حاول مرة أخرى.',
    chatYou: 'أنت',
    chatAssistant: 'المساعد',
    subscriptionTitle: 'الاشتراك',
    subscriptionSubtitle: 'اختر الخطة المناسبة لمزرعتك. يمكنك التغيير في أي وقت.',
    subscriptionCurrentPlan: 'الخطة الحالية',
    subscriptionFree: 'مجاني',
    subscriptionBasic: 'أساسية',
    subscriptionPremium: 'مميزة',
    subscriptionPrice: 'السعر',
    subscriptionPerMonth: '/ شهر',
    subscriptionFeatures: 'المزايا',
    subscriptionSelectPlan: 'اختر الخطة',
    subscriptionMockNotice: 'هذه نسخة تجريبية — الدفعات قريبًا.',
    subscriptionActive: 'نشط',
    subscriptionExpiresAt: 'تنتهي في',
    subscriptionGenericError: 'تعذر تحميل اشتراكك.',
    subscriptionLoading: 'جاري تحميل الخطط…',
    subFeatureFree1: 'حتى 8 توصيات محاصيل',
    subFeatureFree2: 'توقع أساسي للتربة',
    subFeatureFree3: 'دعم المجتمع',
    subFeatureBasic1: 'توصيات محاصيل غير محدودة',
    subFeatureBasic2: 'تحليل متقدم للتربة',
    subFeatureBasic3: 'مكتبة أمراض كاملة',
    subFeatureBasic4: 'دعم عبر البريد الإلكتروني',
    subFeaturePremium1: 'كل ما في الأساسية',
    subFeaturePremium2: 'مساعد محادثة ذكي',
    subFeaturePremium3: 'وصول دون اتصال',
    subFeaturePremium4: 'دعم ذو أولوية',
    subFeaturePremium5: 'وصول مبكر للميزات الجديدة',
    adminTitle: 'لوحة تحكم الإدارة',
    adminFeedback: 'الملاحظات',
    adminStatus: 'الحالة',
    adminNotes: 'ملاحظات الإدارة',
    adminUpdate: 'تحديث',
    adminUpdateSuccess: 'تم تحديث الملاحظة',
    adminFilterAll: 'الكل',
    adminFilterOpen: 'مفتوحة',
    adminFilterInProgress: 'قيد المعالجة',
    adminFilterResolved: 'تم الحل',
    adminUserName: 'المستخدم',
    adminCategory: 'الفئة',
    adminRating: 'التقييم',
    adminMessage: 'الرسالة',
    adminDate: 'التاريخ',
    adminLoading: 'جاري تحميل الملاحظات…',
    adminGenericError: 'تعذر تحميل الملاحظات.',
    adminEmpty: 'لا توجد ملاحظات مطابقة لهذا الفلتر.',
    adminNoNotes: 'لا توجد ملاحظات إدارة بعد.',
    adminExpand: 'عرض التفاصيل',
    commonHigh: 'مرتفع',
    commonMedium: 'متوسط',
    commonLow: 'منخفض',
    commonAll: 'الكل',
  },
};