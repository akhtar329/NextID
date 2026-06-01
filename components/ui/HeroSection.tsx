// app/component/ui/HeroSection.tsx
import Link from "next/link";
import { 
  ChevronRight, 
  Sparkles, 
  LucideIcon
} from "lucide-react";

interface HeroStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  highlight?: string;
  badge?: string;
  stats?: HeroStat[];
  primaryButton?: {
    text: string;
    link: string;
    icon?: LucideIcon;
  };
  secondaryButton?: {
    text: string;
    link: string;
    icon?: LucideIcon;
  };
  bgColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  accentColor?: string;
  compact?: boolean;
}

export function HeroSection({
  title,
  subtitle,
  highlight,
  badge = "Latest Updates",
  stats = [],
  primaryButton,
  secondaryButton,
  bgColor = "from-slate-900 via-indigo-900 to-purple-900",
  gradientFrom = "from-blue-400",
  gradientTo = "to-purple-400",
  accentColor = "indigo",
  compact = false,
}: HeroSectionProps) {
  
  // Dynamic grid columns based on stats length
  const getGridCols = () => {
    const count = stats.length;
    if (count <= 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-3";
    if (count === 4) return "grid-cols-2 sm:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-5";
  };

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${bgColor}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${compact ? 'py-12 lg:py-16' : 'py-16 lg:py-20'}`}>
        <div className="text-center max-w-3xl mx-auto">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>{badge}</span>
            </div>
          )}
          
          <h1 className={`${compact ? 'text-3xl lg:text-5xl' : 'text-4xl lg:text-6xl'} font-bold text-white leading-tight`}>
            {title}
            {highlight && (
              <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
                {highlight}
              </span>
            )}
          </h1>
          
          <p className={`mt-4 text-${accentColor}-100 max-w-2xl mx-auto ${compact ? 'text-base' : 'text-lg'}`}>
            {subtitle}
          </p>
          
          {(primaryButton || secondaryButton) && (
            <div className={`flex flex-wrap gap-3 justify-center ${compact ? 'mt-6' : 'mt-8'}`}>
              {primaryButton && (
                <Link
                  href={primaryButton.link}
                  className={`px-6 py-3 bg-white text-${accentColor}-900 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2 ${compact ? 'px-5 py-2.5 text-sm' : ''}`}
                >
                  {primaryButton.icon && <primaryButton.icon className="w-4 h-4" />}
                  {primaryButton.text}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              {secondaryButton && (
                <Link
                  href={secondaryButton.link}
                  className={`px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center gap-2 ${compact ? 'px-5 py-2.5 text-sm' : ''}`}
                >
                  {secondaryButton.icon && <secondaryButton.icon className="w-4 h-4" />}
                  {secondaryButton.text}
                </Link>
              )}
            </div>
          )}
          
          {/* Stats Grid */}
          {stats.length > 0 && (
            <div className={`grid ${getGridCols()} gap-4 mt-10 max-w-4xl mx-auto ${compact ? 'mt-8' : 'mt-12'}`}>
              {stats.map((stat, idx) => {
                const IconComponent = stat.icon;
                return (
                  <div 
                    key={idx} 
                    className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105 cursor-default"
                  >
                    <IconComponent className="w-5 h-5 text-white/70 mx-auto mb-2" />
                    <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Curved bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full h-8 text-white" preserveAspectRatio="none">
          <path d="M0 32L48 42.7C96 53 192 75 288 80C384 85 480 75 576 64C672 53 768 43 864 48C960 53 1056 75 1152 80C1248 85 1344 75 1392 69.3L1440 64V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V32Z" fill="currentColor"/>
        </svg>
      </div>
    </section>
  );
}