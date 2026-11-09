import React from 'react';

// Base Shimmer block utility
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-violet-950/50 via-indigo-900/30 to-violet-950/50 rounded-xl ${className}`} />
);

// Home Section Skeleton
export const HomeSectionSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-16">
      {/* Hero Banner Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <SkeletonBlock className="h-7 w-48 rounded-full" />
          <SkeletonBlock className="h-12 w-11/12 rounded-2xl" />
          <SkeletonBlock className="h-12 w-4/5 rounded-2xl" />
          <div className="space-y-2 pt-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <SkeletonBlock className="h-13 w-48 rounded-full" />
            <SkeletonBlock className="h-13 w-40 rounded-full" />
          </div>
          <div className="flex gap-6 pt-3">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-6 w-32" />
          </div>
        </div>

        {/* Hero Interactive Diagnostic Simulator Placeholder */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-violet-800/40 bg-violet-950/20 p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-6 w-36 rounded-lg" />
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-16 w-full rounded-2xl" />
            <div className="space-y-3 pt-2">
              <SkeletonBlock className="h-11 w-full rounded-xl" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
            <SkeletonBlock className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* KPI Stats Bar Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-violet-900/30 bg-violet-950/20 space-y-3">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-9 w-28" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* How it works 4-step Cards Skeleton */}
      <div className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <SkeletonBlock className="h-5 w-32 mx-auto rounded-full" />
          <SkeletonBlock className="h-8 w-64 mx-auto rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-violet-900/40 bg-violet-950/20 space-y-4">
              <SkeletonBlock className="w-12 h-12 rounded-xl" />
              <SkeletonBlock className="h-6 w-3/4" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Countries Section Skeleton
export const CountriesSectionSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <SkeletonBlock className="h-6 w-40 mx-auto rounded-full" />
        <SkeletonBlock className="h-9 w-80 mx-auto rounded-xl" />
        <SkeletonBlock className="h-4 w-full mx-auto" />
      </div>

      {/* Country Selection Chips */}
      <div className="flex flex-wrap justify-center gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBlock key={i} className="h-11 w-32 rounded-full" />
        ))}
      </div>

      {/* Detailed Country Viewport Card */}
      <div className="rounded-3xl border border-violet-800/40 bg-violet-950/30 p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-violet-900/40 pb-6">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-7 w-48 rounded-lg" />
              <SkeletonBlock className="h-4 w-64" />
            </div>
          </div>
          <SkeletonBlock className="h-11 w-44 rounded-xl" />
        </div>

        {/* 3 Grid Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-violet-900/30 bg-violet-950/40 space-y-4">
              <SkeletonBlock className="h-5 w-32" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-4/5" />
                <SkeletonBlock className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// School Readiness Section Skeleton
export const SchoolReadinessSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <SkeletonBlock className="h-6 w-36 mx-auto rounded-full" />
        <SkeletonBlock className="h-9 w-72 mx-auto rounded-xl" />
        <SkeletonBlock className="h-4 w-full mx-auto" />
      </div>

      {/* Grade Selector Tabs */}
      <div className="flex justify-center">
        <div className="flex p-1.5 rounded-2xl border border-violet-800/40 bg-violet-950/40 gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4 Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-3xl border border-violet-900/40 bg-violet-950/20 space-y-5">
            <SkeletonBlock className="w-12 h-12 rounded-2xl" />
            <SkeletonBlock className="h-6 w-3/4" />
            <SkeletonBlock className="h-14 w-full" />
            <div className="space-y-2 pt-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-4/5" />
            </div>
            <SkeletonBlock className="h-10 w-full rounded-xl pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Exam Readiness Section Skeleton
export const ExamReadinessSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <SkeletonBlock className="h-6 w-36 mx-auto rounded-full" />
        <SkeletonBlock className="h-9 w-80 mx-auto rounded-xl" />
        <SkeletonBlock className="h-4 w-4/5 mx-auto" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 rounded-3xl border border-violet-900/40 bg-violet-950/20 space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-5 w-24 rounded-full" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="h-6 w-4/5" />
            <SkeletonBlock className="h-12 w-full" />
            <div className="flex flex-wrap gap-1.5 pt-2">
              <SkeletonBlock className="h-6 w-20 rounded-md" />
              <SkeletonBlock className="h-6 w-24 rounded-md" />
              <SkeletonBlock className="h-6 w-16 rounded-md" />
            </div>
            <SkeletonBlock className="h-10 w-full rounded-xl pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Skill Academy Section Skeleton
export const SkillAcademySkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <SkeletonBlock className="h-6 w-32 mx-auto rounded-full" />
        <SkeletonBlock className="h-9 w-72 mx-auto rounded-xl" />
        <SkeletonBlock className="h-4 w-3/4 mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 rounded-3xl border border-violet-900/40 bg-violet-950/20 space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="w-12 h-12 rounded-2xl" />
              <SkeletonBlock className="h-5 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="h-6 w-3/4" />
            <SkeletonBlock className="h-12 w-full" />
            <div className="space-y-2 pt-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
            <SkeletonBlock className="h-10 w-full rounded-xl pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// How It Works Section Skeleton
export const HowItWorksSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <SkeletonBlock className="h-6 w-36 mx-auto rounded-full" />
        <SkeletonBlock className="h-9 w-64 mx-auto rounded-xl" />
        <SkeletonBlock className="h-4 w-4/5 mx-auto" />
      </div>

      {/* Step Numbers Nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-16 rounded-2xl" />
        ))}
      </div>

      {/* Active Step Showcase Card */}
      <div className="p-8 rounded-3xl border border-violet-800/40 bg-violet-950/20 space-y-6">
        <SkeletonBlock className="h-8 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-4/5" />
          </div>
          <SkeletonBlock className="h-44 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

// Portal Viewport Skeleton
export const PortalViewSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0b061d] text-white p-4 sm:p-8 space-y-8">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-3xl border border-violet-700/30 bg-violet-950/30 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-4 w-80" />
          </div>
          <SkeletonBlock className="h-11 w-44 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Main Grid Widgets Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <SkeletonBlock className="h-64 rounded-3xl" />
          <SkeletonBlock className="h-72 rounded-3xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <SkeletonBlock className="h-80 rounded-3xl" />
          <SkeletonBlock className="h-56 rounded-3xl" />
        </div>
      </div>
    </div>
  );
};
