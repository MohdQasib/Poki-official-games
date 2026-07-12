import React, { useState, useEffect } from 'react';

interface BannerAdProps {
  format?: '728x90' | '468x60' | '300x250' | '160x300' | '320x50' | 'responsive' | 'sidebar';
  className?: string;
}

const AD_CONFIGS = {
  '468x60': { key: '93d184ee0bcd3ddd5313ebaf9581b7b7', width: 468, height: 60 },
  '300x250': { key: '76de46645f9d534bd484793c1fc961b7', width: 300, height: 250 },
  '160x300': { key: '2e6179c7ac4af88f883f4fa1a4996a0e', width: 160, height: 300 },
  '320x50': { key: '32884680c0847d1487cce52e2f020634', width: 320, height: 50 },
  '728x90': { key: '43dd22270ecd37780828d4888b99d64a', width: 728, height: 90 },
};

export default function BannerAd({ format = 'responsive', className = '' }: BannerAdProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [size, setSize] = useState<{ key: string; width: number; height: number } | null>(null);

  // Determine size based on format or window width
  useEffect(() => {
    const determineSize = () => {
      if (format !== 'responsive' && format !== 'sidebar' && AD_CONFIGS[format]) {
        setSize(AD_CONFIGS[format]);
        return;
      }

      if (format === 'sidebar') {
        setSize(AD_CONFIGS['160x300']);
        return;
      }

      // Responsive logic
      const width = window.innerWidth;
      if (width >= 1024) {
        setSize(AD_CONFIGS['728x90']);
      } else if (width >= 768) {
        setSize(AD_CONFIGS['468x60']);
      } else {
        setSize(AD_CONFIGS['320x50']);
      }
    };

    determineSize();

    if (format === 'responsive') {
      const handleResize = () => determineSize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [format]);

  // Handle 40 seconds refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 40000); // Refresh exactly every 40 seconds
    return () => clearInterval(interval);
  }, []);

  if (!size) return null;

  // Iframe HTML source with Adsterra configuration
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
            overflow: hidden;
            width: 100%;
            height: 100%;
          }
          #ad-container {
            width: ${size.width}px;
            height: ${size.height}px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
      </head>
      <body>
        <div id="ad-container"></div>
        <script type="text/javascript">
          window.atOptions = {
            'key' : '${size.key}',
            'format' : 'iframe',
            'height' : ${size.height},
            'width' : ${size.width},
            'params' : {}
          };
          
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = 'https://www.highperformanceformat.com/${size.key}/invoke.js';
          script.onerror = function() {
            console.warn('Ad script load failed');
          };
          document.body.appendChild(script);
        </script>
      </body>
    </html>
  `;

  return (
    <div
      id={`ad-container-${size.width}x${size.height}`}
      className={`flex flex-col items-center justify-center overflow-hidden my-6 bg-gradient-to-b from-zinc-900 to-[#0d0e12] rounded-3xl p-4.5 border border-zinc-800/80 hover:border-amber-500/30 transition-all duration-300 shadow-[0_0_30px_rgba(255,183,3,0.06)] ${className}`}
      style={{ minWidth: `${size.width + 10}px` }}
    >
      <span className="text-[8px] font-mono tracking-[0.2em] text-amber-500 uppercase font-black mb-2 animate-pulse flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        SPONSORED PROMOTIONAL CONTENT
      </span>
      <iframe
        key={`${size.key}-${refreshKey}`}
        title={`ad-${size.width}x${size.height}`}
        srcDoc={iframeSrcDoc}
        width={size.width}
        height={size.height}
        scrolling="no"
        frameBorder="0"
        style={{ border: 'none', overflow: 'hidden', background: 'transparent' }}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
