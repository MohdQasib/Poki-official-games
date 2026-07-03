import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface GameLoadingLoaderProps {
  gameId: string;
  gameTitle: string;
  onCancel: () => void;
}

export function GameLoadingLoader({ gameId, gameTitle, onCancel }: GameLoadingLoaderProps) {
  const [metricIndex, setMetricIndex] = useState(0);
  const [adType, setAdType] = useState<'hilltop-vast' | 'exoclick-vast' | 'exoclick-outstream' | 'exoclick-slider' | 'exoclick-interstitial' | 'adsterra-gate'>('exoclick-vast');
  const [adState, setAdState] = useState<'loading' | 'playing' | 'completed'>('loading');
  const [skipTimer, setSkipTimer] = useState(6);
  const [canSkip, setCanSkip] = useState(false);

  const metrics = [
    "VERIFYING SHIELD V9 INTEGRITY...",
    "ESTABLISHING RTC CHANNELS...",
    "MINING CASINO SEEDS...",
    "LOADING GAME CORE ENGINE...",
    "SYNCHRONIZING SECURE LEDGER..."
  ];

  const AD_POOL: ('hilltop-vast' | 'exoclick-vast' | 'exoclick-outstream' | 'exoclick-slider' | 'exoclick-interstitial' | 'adsterra-gate')[] = [
    'hilltop-vast',
    'exoclick-vast',
    'exoclick-outstream',
    'exoclick-slider',
    'exoclick-interstitial',
    'adsterra-gate'
  ];

  // MODULE 1: THE SMART AD ROTATOR & FALLBACK SYSTEM
  useEffect(() => {
    // Select randomly to cycle ads per session, ensuring a unique experience
    const chosen = AD_POOL[Math.floor(Math.random() * AD_POOL.length)];
    setAdType(chosen);
    console.log(`[MONETIZATION] Smart Ad Rotator selected: ${chosen} for this session`);
  }, []);

  // Standard loading metrics rotation
  useEffect(() => {
    if (adState !== 'playing') {
      const interval = setInterval(() => {
        setMetricIndex((prev) => (prev + 1) % metrics.length);
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [adState]);

  const rotateAd = () => {
    setSkipTimer(6);
    setCanSkip(false);
    setAdState('loading');
    setAdType((currentType) => {
      const currentIndex = AD_POOL.indexOf(currentType);
      const nextIndex = (currentIndex + 1) % AD_POOL.length;
      const nextType = AD_POOL[nextIndex];
      console.log(`[MONETIZATION] Switching ad type from ${currentType} to ${nextType} due to No-Fill / Delay.`);
      return nextType;
    });
  };

  // MODULE 1: NO-FILL / DELAY TIMEOUT LOOPER - KEEPS SCREEN LOCKED
  useEffect(() => {
    let rotationTimeout: NodeJS.Timeout;
    if (adState === 'loading') {
      rotationTimeout = setTimeout(() => {
        console.warn("[MONETIZATION] Ad did not render within 4 seconds. Instantly cycling format.");
        rotateAd();
      }, 4000);
    }
    return () => {
      if (rotationTimeout) clearTimeout(rotationTimeout);
    };
  }, [adState, adType]);

  // Handle cross-context messages from iframe player
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data) {
        if (e.data.type === 'EXOCLICK_AD_END' || e.data.type === 'AD_COMPLETED') {
          console.log("[MONETIZATION] Ad completed or skipped inside iframe.");
          handleProceedToGame();
        } else if (e.data.type === 'AD_PLAYING') {
          console.log(`[MONETIZATION] Ad is actively playing: ${adType}`);
          setAdState('playing');
        } else if (e.data.type === 'AD_LOAD_FAILED') {
          console.warn(`[MONETIZATION] Ad failed to load inside iframe for type: ${adType}`);
          rotateAd();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [adType, adState]);

  // MODULE 2: YOUTUBE-STYLE SMART TIMER & SKIP LOGIC
  useEffect(() => {
    if (adState === 'playing') {
      const timer = setInterval(() => {
        setSkipTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanSkip(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adState]);

  const handleProceedToGame = () => {
    // Smoothly clear loading states and launch the game
    window.postMessage({ type: 'EXOCLICK_AD_END' }, '*');
  };

  const getIframeSrcDoc = () => {
    const hilltopVast = "https://crookedagreement.com/d.mhFRztdmG/N-vFZPGUUM/feam/9luUZdUol/k/PvTfcrxoOiD/kx3/NeT/cotbNdzxE/4UOrTTcg2wM/QT";
    const exoclickVast = "https://s.magsrv.com/v1/vast.php?idz=5965862";

    if (adType === 'hilltop-vast' || adType === 'exoclick-vast') {
      const activeVastUrl = adType === 'hilltop-vast' ? hilltopVast : exoclickVast;
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body, html {
              margin: 0; padding: 0; width: 100%; height: 100%; background: black;
              overflow: hidden; display: flex; align-items: center; justify-content: center;
            }
            #video-player {
              width: 100% !important; height: 100% !important; object-fit: contain !important;
            }
          </style>
          <link rel="stylesheet" href="https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css" type="text/css"/>
          <script src="https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js"></script>
        </head>
        <body>
          <video id="video-player" autoplay muted playsinline>
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4">
          </video>
          <script>
            var playerStarted = false;
            
            // MODULE 4: LIGHTWEIGHT HTML5 PLAYER & VAST XML PARSER ENGINE
            function parseAndPlayVast() {
              try {
                var controller = null;
                if (typeof AbortController !== 'undefined') {
                  controller = new AbortController();
                }
                var signal = controller ? controller.signal : null;
                var fetchTimeout = setTimeout(function() {
                  if (controller) controller.abort();
                }, 1500);

                var options = { mode: 'cors' };
                if (signal) options.signal = signal;

                fetch('${activeVastUrl}', options)
                  .then(function(r) { 
                    clearTimeout(fetchTimeout);
                    if (!r.ok) throw new Error("HTTP error " + r.status);
                    return r.text(); 
                  })
                  .then(function(xml) {
                    try {
                      var parser = new DOMParser();
                      var xmlDoc = parser.parseFromString(xml, 'text/xml');
                      
                      // Check for XML parsing error
                      var parserError = xmlDoc.getElementsByTagName('parsererror');
                      if (parserError.length > 0) {
                        throw new Error("XML parsing error");
                      }

                      var mediaFiles = xmlDoc.getElementsByTagName('MediaFile');
                      if (mediaFiles && mediaFiles.length > 0) {
                        var directUrl = '';
                        for (var i = 0; i < mediaFiles.length; i++) {
                          var type = mediaFiles[i].getAttribute('type') || '';
                          if (type.indexOf('video') !== -1 || type.indexOf('mp4') !== -1) {
                            directUrl = mediaFiles[i].textContent.trim();
                            break;
                          }
                        }
                        if (!directUrl) {
                          directUrl = mediaFiles[0].textContent.trim();
                        }

                        // Remove CDATA wrapper characters
                        directUrl = directUrl.replace(/^<!\\[CDATA\\[/, '').replace(/\\]\\]>$/, '');

                        if (!directUrl) {
                          throw new Error("No media file URL found in VAST XML");
                        }

                        // Clean mixed content if page is HTTPS and VAST returns HTTP URL
                        if (window.location.protocol === 'https:' && directUrl.indexOf('http:') === 0) {
                          directUrl = directUrl.replace('http:', 'https:');
                        }

                        var video = document.getElementById('video-player');
                        video.src = directUrl;
                        video.load();
                        
                        // Setup event listeners
                        video.onplaying = function() {
                          playerStarted = true;
                          window.parent.postMessage({ type: 'AD_PLAYING' }, '*');
                        };
                        video.onerror = function() {
                          window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
                        };
                        video.onended = function() {
                          window.parent.postMessage({ type: 'AD_COMPLETED' }, '*');
                        };

                        video.play().catch(function(e) {
                          // Try muted autoplay fallback
                          video.muted = true;
                          video.play().catch(function() {
                            window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
                          });
                        });
                      } else {
                        throw new Error("No media file elements found in VAST XML");
                      }
                    } catch(innerErr) {
                      launchFluidPlayer();
                    }
                  })
                  .catch(function(err) {
                    clearTimeout(fetchTimeout);
                    launchFluidPlayer();
                  });
              } catch (e) {
                launchFluidPlayer();
              }
            }

            function launchFluidPlayer() {
              try {
                if (typeof fluidPlayer === 'undefined') {
                  throw new Error("FluidPlayer CDN not loaded or blocked by ad-blocker");
                }
                var fp = fluidPlayer('video-player', {
                  layoutControls: {
                    autoPlay: true, mute: true, keyboardControl: false, allowTheatre: false,
                    doubleclickFullscreen: false, playbackRateControl: false, logo: { showOverAllAnims: false }
                  },
                  vastOptions: {
                    adList: [{ roll: 'preRoll', vastTag: '${activeVastUrl}' }],
                    adStartedCallback: function() {
                      playerStarted = true;
                      window.parent.postMessage({ type: 'AD_PLAYING' }, '*');
                    },
                    adErrorCallback: function() {
                      window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
                    },
                    adFinishedCallback: function() {
                      window.parent.postMessage({ type: 'AD_COMPLETED' }, '*');
                    }
                  }
                });
              } catch(e) {
                window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
              }
            }

            // Begin parsing sequence
            parseAndPlayVast();

            // Safety timeout to trigger fallback if everything gets stuck or blocked
            setTimeout(function() {
              if (!playerStarted) {
                window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
              }
            }, 1500);
          </script>
        </body>
        </html>
      `;
    } else if (adType === 'exoclick-outstream') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body, html {
              margin: 0; padding: 0; width: 100%; height: 100%; background: black;
              overflow: hidden; display: flex; align-items: center; justify-content: center;
            }
            .outstream-box {
              width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="outstream-box">
            <ins class="eas6a97888e37" data-zoneid="5965992"></ins>
          </div>
          <script>
            var script = document.createElement('script');
            script.async = true;
            script.type = 'application/javascript';
            script.src = 'https://a.magsrv.com/ad-provider.js';
            script.onload = function() {
              try {
                (window.AdProvider = window.AdProvider || []).push({"serve": {}});
                window.parent.postMessage({ type: 'AD_PLAYING' }, '*');
              } catch(e) {
                window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
              }
            };
            script.onerror = function() {
              window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
            };
            document.head.appendChild(script);
          </script>
        </body>
        </html>
      `;
    } else if (adType === 'exoclick-slider') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body, html {
              margin: 0; padding: 0; width: 100%; height: 100%; background: black;
              overflow: hidden; display: flex; align-items: center; justify-content: center;
              position: relative;
            }
            .slider-box {
              width: 100%; height: 100%; position: absolute; left: 0; top: 0;
              display: flex; align-items: center; justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="slider-box">
            <ins class="eas6a97888e31" data-zoneid="5965996"></ins>
          </div>
          <script>
            var script = document.createElement('script');
            script.async = true;
            script.type = 'application/javascript';
            script.src = 'https://a.magsrv.com/ad-provider.js';
            script.onload = function() {
              try {
                (window.AdProvider = window.AdProvider || []).push({"serve": {}});
                window.parent.postMessage({ type: 'AD_PLAYING' }, '*');
              } catch(e) {
                window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
              }
            };
            script.onerror = function() {
              window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
            };
            document.head.appendChild(script);
          </script>
        </body>
        </html>
      `;
    } else if (adType === 'exoclick-interstitial') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body, html {
              margin: 0; padding: 0; width: 100%; height: 100%; background: black;
              overflow: hidden; display: flex; align-items: center; justify-content: center;
            }
            .interstitial-box {
              width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="interstitial-box">
            <ins class="eas6a97888e33" data-zoneid="5965856"></ins>
          </div>
          <script>
            var script = document.createElement('script');
            script.async = true;
            script.type = 'application/javascript';
            script.src = 'https://a.pemsrv.com/ad-provider.js';
            script.onload = function() {
              try {
                (window.AdProvider = window.AdProvider || []).push({"serve": {}});
                window.parent.postMessage({ type: 'AD_PLAYING' }, '*');
              } catch(e) {
                window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
              }
            };
            script.onerror = function() {
              window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
            };
            document.head.appendChild(script);
          </script>
        </body>
        </html>
      `;
    } else {
      // adType === 'adsterra-gate'
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body, html {
              margin: 0; padding: 0; width: 100%; height: 100%; background: black;
              overflow: hidden; display: flex; align-items: center; justify-content: center;
              position: relative;
            }
            .adsterra-box {
              width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="adsterra-box">
            <div id="container-93d184ee0bcd3ddd5313ebaf9581b7b7"></div>
          </div>
          <script>
            window.atOptions = {
              'key' : '93d184ee0bcd3ddd5313ebaf9581b7b7',
              'format' : 'iframe',
              'height' : 60,
              'width' : 468,
              'params' : {}
            };
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://www.highperformanceformat.com/93d184ee0bcd3ddd5313ebaf9581b7b7/invoke.js';
            script.onload = function() {
              window.parent.postMessage({ type: 'AD_PLAYING' }, '*');
            };
            script.onerror = function() {
              window.parent.postMessage({ type: 'AD_LOAD_FAILED' }, '*');
            };
            document.head.appendChild(script);
          </script>
        </body>
        </html>
      `;
    }
  };

  const isCinematic = adType === 'hilltop-vast' || adType === 'exoclick-vast' || adType === 'exoclick-outstream';
  const useCinematicOverlay = isCinematic && adState === 'playing';

  return (
    <div className={useCinematicOverlay 
      ? "fixed inset-0 z-[120] bg-black/98 flex flex-col items-center justify-center p-4 sm:p-8 select-none animate-fade-in"
      : "flex-1 w-full bg-black flex flex-col items-center justify-center p-8 relative min-h-[440px] border border-zinc-800 select-none"
    }>
      {/* Cinematic Pulse Header Scanline bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4af37] via-amber-500 to-[#d4af37] opacity-60 animate-pulse" />
      
      {/* Background Matrix Starfield Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {adState === 'loading' ? (
        <div className="flex flex-col items-center justify-center space-y-6 text-center py-8 max-w-sm w-full animate-fade-in">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#d4af37] border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
          <div>
            <h3 className="text-sm font-mono font-black text-[#d4af37] uppercase tracking-widest animate-pulse">Retrieving Premium Sponsored Content...</h3>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mt-2.5 leading-relaxed">
              Securing sponsor slot. Please wait.
            </p>
            <p className="text-[9px] text-amber-500/80 font-mono uppercase tracking-widest mt-1.5 font-bold">
              FORMAT: {adType.toUpperCase()}
            </p>
          </div>
          
          {/* Invisible background frame to initialize ad rendering */}
          <div className="w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
            <iframe
              srcDoc={getIframeSrcDoc()}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              title="Sponsor Active Loader"
            />
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 max-w-xs mx-auto">
            <p className="text-[9px] text-zinc-500 font-mono leading-relaxed">
              If loading is delayed, please ensure ad-blockers are disabled or wait for our server to establish fallback sponsors.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="px-5 py-2 bg-zinc-950/95 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[9px] font-mono uppercase tracking-[0.2em] font-black rounded-xl transition duration-200 active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-black"
          >
            ‹ Abort Launch
          </button>
        </div>
      ) : (
        <div className={useCinematicOverlay 
          ? "max-w-4xl w-full text-center flex flex-col items-center relative z-10 space-y-4"
          : "max-w-lg w-full text-center flex flex-col items-center relative z-10 space-y-6"
        }>
          
          {/* Header Banner - Only show if not playing a full cinematic video */}
          {adState !== 'playing' && (
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold leading-none font-mono">Hollywood Security Gate</h4>
              <h3 className="text-xl font-black text-[#d4af37] tracking-widest uppercase mt-3 font-sans drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                {gameTitle || 'PRO GAMEPLAY'}
              </h3>
            </div>
          )}

          {/* Embedded Dynamic Ad Player Container Box */}
          <div className={useCinematicOverlay 
            ? "w-full aspect-video bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative shadow-[#d4af37]/5"
            : "w-full max-w-md aspect-video bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative"
          }>
            <iframe
              srcDoc={getIframeSrcDoc()}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              title="Smart Rotator Ad System"
            />

            {/* Smart Countdown/Skip Button overlay */}
            {adState === 'playing' && (
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                {!canSkip ? (
                  <div className="px-4 py-2.5 bg-black/85 backdrop-blur-md rounded-xl border border-zinc-800 text-white font-mono text-[10px] font-black tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    AD ENDS IN <span className="text-[#d4af37]">{skipTimer}s</span>
                  </div>
                ) : (
                  <button
                    onClick={handleProceedToGame}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 active:scale-95 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer flex items-center gap-2 transition-all animate-bounce"
                  >
                    Skip Ad <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cancel button - Abort Launch */}
          {adState !== 'playing' && (
            <button
              onClick={onCancel}
              className="px-5 py-2 bg-zinc-950/95 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[9px] font-mono uppercase tracking-[0.2em] font-black rounded-xl transition duration-200 active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-black"
            >
              ‹ Abort Launch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
