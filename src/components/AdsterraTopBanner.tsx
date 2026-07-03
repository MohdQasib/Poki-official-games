import React, { useEffect, useRef } from 'react';

export function AdsterraTopBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      containerRef.current.innerHTML = '';
      
      // Inject atOptions config script
      const configScript = document.createElement('script');
      configScript.text = `
        atOptions = {
          'key' : '93d184ee0bcd3ddd5313ebaf9581b7b7',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      containerRef.current.appendChild(configScript);

      // Inject active loader script
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/93d184ee0bcd3ddd5313ebaf9581b7b7/invoke.js';
      containerRef.current.appendChild(invokeScript);
    } catch (e) {
      console.error("[MONETIZATION] Error rendering Adsterra Top Banner:", e);
    }
  }, []);

  return (
    <div 
      style={{ minHeight: '60px', width: '100%', maxWidth: '468px', margin: '0 auto 15px auto', textAlign: 'center' }}
      className="flex items-center justify-center overflow-hidden z-10"
    >
      <div ref={containerRef} id="adsterra-banner-container" className="w-full flex justify-center" />
    </div>
  );
}
