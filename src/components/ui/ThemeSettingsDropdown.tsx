import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { PRIMARY_COLORS } from '../../types/theme.types';
import { Paintbrush } from 'lucide-react';
import { Dropdown } from './Dropdown';

export const ThemeSettingsDropdown: React.FC = () => {
  const { 
    backgroundImage, 
    backgroundColor, 
    primaryColor, 
    setPrimaryColor, 
    setBackgroundColor, 
    setBackgroundImage 
  } = useThemeStore();

  const handleResetBg = () => {
    setBackgroundColor(null);
    setBackgroundImage(null);
  };

  return (
    <Dropdown
      trigger={
        <button className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors" title="Theme Settings">
          <Paintbrush className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          {(backgroundColor || backgroundImage) && (
            <span 
              className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white shadow-sm" 
              style={backgroundColor ? { background: backgroundColor } : { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }} 
            />
          )}
        </button>
      }
    >
      <div className="p-3.5 w-[260px]">
        {/* Theme Colors */}
        <div className="mb-4">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none opacity-60">
            Theme Colors
          </div>
          <div className="grid grid-cols-4 gap-2.5 px-2">
            {PRIMARY_COLORS.map((color) => {
              const isSelected = primaryColor === color.value;
              return (
                <button
                  key={color.id}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`h-10 w-10 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-sm`}
                  style={{ 
                    background: color.value, 
                    borderColor: isSelected ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)' 
                  }}
                  title={color.label}
                >
                  {isSelected && (
                    <span className="h-3 w-3 rounded-full bg-white shadow-sm animate-scale-up" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="my-2.5 h-px" style={{ background: 'var(--color-border)' }} />

        {/* Background Colors */}
        <div className="mb-4">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none opacity-60">
            Background Colors
          </div>
          <div className="grid grid-cols-5 gap-2 px-2">
            {/* Default */}
            <button
              onClick={handleResetBg}
              className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-sm`}
              style={{ 
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1))',
                borderColor: (!backgroundColor && !backgroundImage) ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Default Mesh"
            >
              {!backgroundColor && !backgroundImage && (
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
            {/* Slate */}
            <button
              onClick={() => setBackgroundColor('#0f172a')}
              className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-sm`}
              style={{ 
                background: '#0f172a',
                borderColor: backgroundColor === '#0f172a' ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Midnight Slate"
            >
              {backgroundColor === '#0f172a' && (
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
            {/* Charcoal */}
            <button
              onClick={() => setBackgroundColor('#1e1b4b')}
              className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-sm`}
              style={{ 
                background: '#1e1b4b',
                borderColor: backgroundColor === '#1e1b4b' ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Deep Charcoal"
            >
              {backgroundColor === '#1e1b4b' && (
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
            {/* Forest */}
            <button
              onClick={() => setBackgroundColor('#022c22')}
              className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-sm`}
              style={{ 
                background: '#022c22',
                borderColor: backgroundColor === '#022c22' ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Emerald Forest"
            >
              {backgroundColor === '#022c22' && (
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
            {/* Burgundy */}
            <button
              onClick={() => setBackgroundColor('#31102f')}
              className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-sm`}
              style={{ 
                background: '#31102f',
                borderColor: backgroundColor === '#31102f' ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Royal Burgundy"
            >
              {backgroundColor === '#31102f' && (
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
          </div>
        </div>

        <div className="my-2.5 h-px" style={{ background: 'var(--color-border)' }} />

        {/* Background Images */}
        <div>
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none opacity-60">
            Background Images
          </div>
          <div className="grid grid-cols-3 gap-3 px-2">
            {/* Aurora */}
            <button
              onClick={() => setBackgroundImage('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80')}
              className={`h-12 rounded-xl border-2 overflow-hidden transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-sm`}
              style={{ 
                backgroundImage: 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=120&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderColor: backgroundImage?.includes('1579546929518') ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Aurora Glow"
            >
              {backgroundImage?.includes('1579546929518') && (
                <span className="h-3 w-3 rounded-full bg-white shadow-md border border-black/10 animate-scale-up" />
              )}
            </button>
            {/* Sunset */}
            <button
              onClick={() => setBackgroundImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80')}
              className={`h-12 rounded-xl border-2 overflow-hidden transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-sm`}
              style={{ 
                backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderColor: backgroundImage?.includes('1618005182384') ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Sunset Wave"
            >
              {backgroundImage?.includes('1618005182384') && (
                <span className="h-3 w-3 rounded-full bg-white shadow-md border border-black/10 animate-scale-up" />
              )}
            </button>
            {/* Cyberpunk */}
            <button
              onClick={() => setBackgroundImage('https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80')}
              className={`h-12 rounded-xl border-2 overflow-hidden transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-sm`}
              style={{ 
                backgroundImage: 'url(https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=120&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderColor: backgroundImage?.includes('1508739773434') ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)'
              }}
              title="Cyberpunk"
            >
              {backgroundImage?.includes('1508739773434') && (
                <span className="h-3 w-3 rounded-full bg-white shadow-md border border-black/10 animate-scale-up" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
