import React, { useState, useEffect } from 'react';
import { NavTab, CountryCode } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeSection } from './components/HomeSection';
import { CountriesSection } from './components/CountriesSection';
import { SchoolReadinessSection } from './components/SchoolReadinessSection';
import { ExamReadinessSection } from './components/ExamReadinessSection';
import { SkillAcademySection } from './components/SkillAcademySection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PortalView } from './components/portal/PortalView';
import { ThreeBackground } from './components/ThreeBackground';
import { openDemoWhatsApp, openHelpWhatsApp, WHATSAPP_DISPLAY } from './utils/whatsapp';
import { 
  HomeSectionSkeleton, 
  CountriesSectionSkeleton, 
  SchoolReadinessSkeleton, 
  ExamReadinessSkeleton, 
  SkillAcademySkeleton, 
  HowItWorksSkeleton,
  PortalViewSkeleton
} from './components/SkeletonLoaders';
import { MessageCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('australia');
  const [isPortalActive, setIsPortalActive] = useState(false);
  const [isLoadingSection, setIsLoadingSection] = useState(false);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, isPortalActive]);

  // Every "Book a free demo" button on the site (the child components still call this prop
  // `onOpenDemoModal`) now opens WhatsApp directly with a pre-filled message.
  // Wrapped in an arrow fn on purpose: onClick={...} would otherwise pass the click event along.
  const handleBookDemo = () => {
    openDemoWhatsApp();
  };

  // Floating / footer "Chat on WhatsApp" buttons open a real WhatsApp chat as well.
  const handleOpenWhatsApp = () => {
    openHelpWhatsApp();
  };

  const handleTogglePortal = () => {
    setIsLoadingSection(true);
    setIsPortalActive(prev => !prev);
    setTimeout(() => {
      setIsLoadingSection(false);
    }, 350);
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'portal') {
      setIsLoadingSection(true);
      setIsPortalActive(true);
      setTimeout(() => {
        setIsLoadingSection(false);
      }, 350);
    } else {
      if (tab !== activeTab || isPortalActive) {
        setIsLoadingSection(true);
        setIsPortalActive(false);
        setActiveTab(tab);
        setTimeout(() => {
          setIsLoadingSection(false);
        }, 320);
      }
    }
  };

  const handleSelectCountry = (country: CountryCode) => {
    setSelectedCountry(country);
    if (!isPortalActive && activeTab !== 'countries' && activeTab !== 'exams') {
      setIsLoadingSection(true);
      setActiveTab('countries');
      setTimeout(() => {
        setIsLoadingSection(false);
      }, 300);
    }
  };

  // If in Portal view, display the complete PortalView LMS/TMS system or its skeleton
  if (isPortalActive) {
    return (
      <div className="min-h-screen cosmic-nebula-bg text-white relative selection:bg-amber-500 selection:text-slate-950">
        {/* Ambient 3D Interactive Cosmos */}
        <ThreeBackground />

        <div className="relative z-10">
          {isLoadingSection ? (
            <PortalViewSkeleton />
          ) : (
            <PortalView
              onBackToHome={() => {
                setIsLoadingSection(true);
                setIsPortalActive(false);
                setTimeout(() => setIsLoadingSection(false), 300);
              }}
              onOpenBooking={handleBookDemo}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-nebula-bg text-white flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* 3D Animated Cosmic Knowledge Universe Layer */}
      <ThreeBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Bar with wordmark, text links, and Try a Free Demo CTA */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenDemoModal={handleBookDemo}
          selectedCountry={selectedCountry}
          onSelectCountry={handleSelectCountry}
          isPortalActive={isPortalActive}
          onTogglePortal={handleTogglePortal}
        />

        {/* Main Public Content Sections or Skeleton Loaders */}
        <main className="flex-1 pb-24 sm:pb-12 transition-opacity duration-200">
          {isLoadingSection ? (
            <div>
              {activeTab === 'home' && <HomeSectionSkeleton />}
              {activeTab === 'countries' && <CountriesSectionSkeleton />}
              {activeTab === 'school' && <SchoolReadinessSkeleton />}
              {activeTab === 'exams' && <ExamReadinessSkeleton />}
              {activeTab === 'skills' && <SkillAcademySkeleton />}
              {activeTab === 'how-it-works' && <HowItWorksSkeleton />}
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeSection
                  onSelectTab={handleSelectTab}
                  onOpenDemoModal={handleBookDemo}
                  selectedCountry={selectedCountry}
                  onSelectCountry={handleSelectCountry}
                  onTogglePortal={handleTogglePortal}
                />
              )}

              {activeTab === 'countries' && (
                <CountriesSection
                  onSelectTab={handleSelectTab}
                  onOpenDemoModal={handleBookDemo}
                  selectedCountry={selectedCountry}
                  onSelectCountry={handleSelectCountry}
                />
              )}

              {activeTab === 'school' && (
                <SchoolReadinessSection
                  onSelectTab={handleSelectTab}
                  onOpenDemoModal={handleBookDemo}
                />
              )}

              {activeTab === 'exams' && (
                <ExamReadinessSection
                  onSelectTab={handleSelectTab}
                  onOpenDemoModal={handleBookDemo}
                  selectedCountry={selectedCountry}
                  onSelectCountry={handleSelectCountry}
                />
              )}

              {activeTab === 'skills' && (
                <SkillAcademySection
                  onSelectTab={handleSelectTab}
                  onOpenDemoModal={handleBookDemo}
                />
              )}

              {activeTab === 'how-it-works' && (
                <HowItWorksSection
                  onSelectTab={handleSelectTab}
                  onOpenDemoModal={handleBookDemo}
                />
              )}
            </>
          )}
        </main>

        {/* Complete Footer mirroring all screenshots */}
        <Footer
          onSelectTab={handleSelectTab}
          onSelectCountry={handleSelectCountry}
          onOpenDemoModal={handleBookDemo}
          onOpenWhatsApp={handleOpenWhatsApp}
          onTogglePortal={handleTogglePortal}
        />

        {/* Mobile Sticky Floating CTA Bar (Under 15% viewport height rule, matching Screenshot_20261026-195434_Chrome_0a8216c5.png) */}
        <aside aria-label="Mobile quick actions" className="sm:hidden fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="flex items-center justify-between gap-3 pointer-events-auto max-w-md mx-auto">
            {/* Centered Large Amber Button matching screenshot */}
            <button
              onClick={handleBookDemo}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#f59e0b] active:bg-[#d97706] text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/30 text-center transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Try a Free Demo</span>
            </button>

            {/* Floating WhatsApp Quick Action Button */}
            <button
              onClick={handleOpenWhatsApp}
              title="Chat on WhatsApp"
              className="w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-90 text-white flex items-center justify-center shadow-xl shadow-emerald-900/40 transition-all flex-shrink-0"
            >
              <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
            </button>
          </div>
        </aside>

        {/* Desktop WhatsApp Floating Action Button */}
        <div className="hidden sm:block fixed bottom-6 right-6 z-40">
          <button
            onClick={handleOpenWhatsApp}
            title={`Chat with Tutor Monk Academic Counselor on WhatsApp (${WHATSAPP_DISPLAY})`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-sm shadow-2xl shadow-emerald-950/60 transition-all hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
            <span>Need Help? Chat on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
