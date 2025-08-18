/** @type {AppTypes.Config} test2*/
window.config = {
  // Browser tab title
  appTitle: "iCRco Viewer",
  
  routerBasename: null,
  showStudyList: true,
  extensions: [],
  modes: [],
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  investigationalUseDialog: {
    option: 'never', // or 'always' or 'accept'
  },
  studyPrefetcher: {
    enabled: true,
    displaySetsCount: 1, // Reduced from 2 to save memory
    maxNumPrefetchRequests: 5, // Reduced from 10
    order: 'closest',
  },
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Orthanc Server',
        name: 'Orthanc',
        wadoUriRoot: '/wado',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
  whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement('a', {
        target: '_self',
        rel: 'noopener noreferrer',
        className: 'text-purple-600 line-through',
        href: 'http://www.icrco.com',
      },
        React.createElement('img', {
          src: '/iCRcoLogo.png',
          alt: 'iCRco Logo',
          style: {
            maxHeight: '40px',
            maxWidth: '200px'
          }
        })
      );
    }
  },
  cornerstone: {
    // AGGRESSIVE: Much smaller cache for beta version memory leaks
    maxCacheSize: 256 * 1024 * 1024, // 256MB - very conservative for beta
    useWebWorkers: true,
    
    // GPU and rendering settings - CONSERVATIVE
    enableGPURendering: true,
    preferSizeOverAccuracy: true, // CHANGED: Prefer memory over accuracy for large volumes
    strictZSpacingForVolumeViewport: false,
    
    // CONSERVATIVE: WebGL settings for problematic beta
    maxTextureSize: 1024, // REDUCED: Conservative for memory issues
    useWebGL2: true, // Keep WebGL2 for better memory management
    
    // AGGRESSIVE: Memory management settings
    enableSharedArrayBuffer: false,
    maxNumberOfFramesToRender: 50, // VERY conservative frame limit
    useNorm16Texture: false, // Disable high-precision textures
    
    // AGGRESSIVE: Volume-specific optimizations
    volumeRendering: {
      preferredTextureDimensions: [256, 256, 256], // Much smaller 3D texture
      enableSubsampling: true,
      subsamplingThreshold: 400, // LOWERED: Enable subsampling earlier
      subsamplingFactor: 3, // INCREASED: Skip more slices
    }
  },
  maxConcurrentMetadataRequests: 3, // REDUCED: Prevent overwhelming browser
  enableLazyLoading: true,
  enableProgressiveRendering: true,

  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  }
};

// WebGL Context Recovery System - COMPLETELY REWRITTEN
(function() {
  let webglContextLost = false;
  let contextLossCount = 0;
  const MAX_CONTEXT_LOSS_RETRIES = 3;
  
  // Function to handle WebGL context loss
  function handleContextLoss(event) {
    console.warn('WebGL context lost, attempt:', ++contextLossCount);
    webglContextLost = true;
    event.preventDefault(); // Prevent default context loss behavior
    
    // Show user notification
    showContextLossNotification();
    
    // Clear any large volume data from memory
    clearVolumeCache();
  }
  
  // Function to handle WebGL context restoration
  function handleContextRestore(event) {
    console.log('WebGL context restored');
    webglContextLost = false;
    
    // Wait a moment then reload the current study
    setTimeout(() => {
      if (contextLossCount <= MAX_CONTEXT_LOSS_RETRIES) {
        console.log('Reloading study after context restoration...');
        // Instead of full page reload, try to reload just the viewport
        reloadCurrentViewport();
      } else {
        console.error('Too many context losses, requiring manual refresh');
        showManualRefreshNotification();
      }
    }, 1000);
  }
  
  // Clear volume cache to free memory
  function clearVolumeCache() {
    try {
      // Clear Cornerstone cache if available
      if (window.cornerstone3D && window.cornerstone3D.cache) {
        window.cornerstone3D.cache.purgeCache();
      }
      
      // Force garbage collection if available (for development)
      if (window.gc) {
        window.gc();
      }
      
      console.log('Volume cache cleared due to WebGL context loss');
    } catch (error) {
      console.error('Error clearing volume cache:', error);
    }
  }
  
  // Reload current viewport instead of full page
  function reloadCurrentViewport() {
    try {
      // Try to access OHIF services
      if (window.ohif && window.ohif.services) {
        const { servicesManager } = window.ohif;
        const viewportGridService = servicesManager.services?.viewportGridService;
        const cornerstoneViewportService = servicesManager.services?.cornerstoneViewportService;
        
        if (viewportGridService && cornerstoneViewportService) {
          // Get current viewport info
          const { activeViewportId } = viewportGridService.getState();
          
          if (activeViewportId) {
            console.log('Attempting to refresh viewport:', activeViewportId);
            // Trigger viewport refresh
            cornerstoneViewportService.render(activeViewportId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to reload viewport, falling back to page reload:', error);
      window.location.reload();
    }
  }
  
  // Show user notification for context loss
  function showContextLossNotification() {
    const notice = document.createElement('div');
    notice.id = 'webgl-context-loss-notice';
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 165, 0, 0.95);
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10001;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    notice.innerHTML = `
      <strong>⚠️ Large Volume Detected</strong><br>
      Optimizing rendering for ${contextLossCount > 1 ? 'stability' : 'performance'}...<br>
      <small>Volume rendering will resume automatically</small>
    `;
    
    document.body.appendChild(notice);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const existingNotice = document.getElementById('webgl-context-loss-notice');
      if (existingNotice) {
        existingNotice.remove();
      }
    }, 5000);
  }
  
  // Show manual refresh notification
  function showManualRefreshNotification() {
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(220, 53, 69, 0.95);
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10001;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    notice.innerHTML = `
      <strong>Volume Too Large</strong><br>
      Please refresh the page to continue<br>
      <button onclick="window.location.reload()" style="
        background: white;
        color: #dc3545;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        margin-top: 5px;
        cursor: pointer;
      ">Refresh Page</button>
    `;
    
    document.body.appendChild(notice);
  }
  
  // Setup WebGL context monitoring
  function setupWebGLMonitoring() {
    // Wait for canvas elements to be created
    const checkForCanvas = setInterval(() => {
      const canvases = document.querySelectorAll('canvas');
      
      if (canvases.length > 0) {
        clearInterval(checkForCanvas);
        
        canvases.forEach((canvas, index) => {
          console.log(`Setting up WebGL monitoring for canvas ${index}`);
          
          // Add context loss/restore listeners
          canvas.addEventListener('webglcontextlost', handleContextLoss, false);
          canvas.addEventListener('webglcontextrestored', handleContextRestore, false);
          
          // Monitor for context state
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (gl) {
            // Check if context is already lost
            if (gl.isContextLost()) {
              console.warn('Canvas context already lost on setup');
              webglContextLost = true;
            }
          }
        });
      }
    }, 500);
    
    // Stop checking after 30 seconds
    setTimeout(() => clearInterval(checkForCanvas), 30000);
  }
  
// AGGRESSIVE Memory Management for Beta Version
(function() {
  let memoryCheckInterval;
  let aggressiveCleanupActive = false;
  
  function aggressiveMemoryManagement() {
    const checkMemory = () => {
      if (performance.memory) {
        const memInfo = performance.memory;
        const usedMB = Math.round(memInfo.usedJSHeapSize / (1024 * 1024));
        const limitMB = Math.round(memInfo.jsHeapSizeLimit / (1024 * 1024));
        const usedPercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
        
        // AGGRESSIVE: Start cleanup much earlier for beta version
        if (usedPercent > 60 && !aggressiveCleanupActive) {
          console.log(`Starting aggressive cleanup at ${usedPercent.toFixed(1)}% memory usage`);
          aggressiveCleanupActive = true;
          performAggressiveCleanup();
        }
        
        // CRITICAL: Force cleanup if over 80%
        if (usedPercent > 80) {
          console.warn(`CRITICAL memory usage: ${usedPercent.toFixed(1)}% - forcing cleanup`);
          performCriticalCleanup();
        }
        
        // EMERGENCY: Prevent crash at 90%
        if (usedPercent > 90) {
          console.error(`EMERGENCY: ${usedPercent.toFixed(1)}% memory - preventing crash`);
          location.reload();
        }
      }
    };
    
    // Check memory every 2 seconds (more frequent for beta)
    memoryCheckInterval = setInterval(checkMemory, 2000);
  }
  
  function performAggressiveCleanup() {
    try {
      // Clear all Cornerstone caches
      if (window.cornerstone3D) {
        if (window.cornerstone3D.cache) {
          window.cornerstone3D.cache.purgeCache();
        }
        if (window.cornerstone3D.imageCache) {
          window.cornerstone3D.imageCache.purgeCache();
        }
        if (window.cornerstone3D.volumeCache) {
          window.cornerstone3D.volumeCache.purgeCache();
        }
      }
      
      // Clear legacy cornerstone cache
      if (window.cornerstone && window.cornerstone.imageCache) {
        window.cornerstone.imageCache.purgeCache();
      }
      
      // Force garbage collection
      if (window.gc) {
        window.gc();
      }
      
      console.log('Aggressive cleanup completed');
      aggressiveCleanupActive = false;
      
    } catch (error) {
      console.error('Error during aggressive cleanup:', error);
    }
  }
  
  function performCriticalCleanup() {
    try {
      // Everything from aggressive cleanup plus more
      performAggressiveCleanup();
      
      // Clear viewport renderings
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          // Clear GL resources
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
      });
      
      // Trigger browser garbage collection more aggressively
      if (window.gc) {
        window.gc();
        setTimeout(() => window.gc(), 100);
        setTimeout(() => window.gc(), 500);
      }
      
      console.log('Critical cleanup completed');
      
    } catch (error) {
      console.error('Error during critical cleanup:', error);
    }
  }
  
  // Start aggressive memory management
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aggressiveMemoryManagement);
  } else {
    aggressiveMemoryManagement();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
    }
    performAggressiveCleanup();
  });
  
})();
  
  // Initialize when DOM is ready
  function initializeWebGLRecovery() {
    setupWebGLMonitoring();
    monitorMemoryUsage();
    
    console.log('WebGL context recovery system initialized');
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebGLRecovery);
  } else {
    initializeWebGLRecovery();
  }
  
})();

// IMPROVED: Dynamic Volume Slice Limiting System
(function() {
  const VOLUME_SLICE_LIMIT = 300; // REDUCED: Very conservative for memory issues
  const LARGE_SERIES_THRESHOLD = 300; // REDUCED: Start optimization earlier
  
  // Store original volume loading functions
  let originalVolumeLoader = null;
  let originalViewportService = null;
  
  // Track which series have been processed
  const processedSeries = new Map();
  
  // Function to calculate optimal slice sampling with better distribution
  function calculateSliceSampling(totalSlices, targetSlices) {
    if (totalSlices <= targetSlices) {
      return { step: 1, start: 0, count: totalSlices };
    }
    
    // Use more intelligent sampling for medical data
    const step = Math.max(1, Math.floor(totalSlices / targetSlices));
    const actualCount = Math.floor(totalSlices / step);
    const start = Math.floor((totalSlices - (actualCount * step)) / 2);
    
    console.log(`Volume sampling: ${totalSlices} slices -> ${actualCount} slices (step: ${step})`);
    
    return { step, start, count: actualCount };
  }
  
  // Function to create subsampled slice indices
  function createSubsampledIndices(totalSlices, sampling) {
    const indices = [];
    for (let i = 0; i < sampling.count; i++) {
      const index = sampling.start + (i * sampling.step);
      if (index < totalSlices) {
        indices.push(index);
      }
    }
    return indices;
  }
  
  // Hook into volume creation process
  function interceptVolumeCreation() {
    // Wait for OHIF to be fully loaded
    const checkOHIF = setInterval(() => {
      if (window.ohif && window.ohif.services) {
        clearInterval(checkOHIF);
        setupVolumeInterception();
      }
    }, 100);
  }
  
  function setupVolumeInterception() {
    try {
      // Hook into viewport service
      const { servicesManager } = window.ohif;
      if (servicesManager) {
        const viewportGridService = servicesManager.services?.viewportGridService;
        const cornerstoneViewportService = servicesManager.services?.cornerstoneViewportService;
        
        if (cornerstoneViewportService) {
          // Override volume viewport creation
          const originalCreateViewport = cornerstoneViewportService.createViewport;
          
          cornerstoneViewportService.createViewport = function(viewportId, type, displaySetInstanceUID, displaySet) {
            console.log('Creating viewport:', type, displaySet);
            
            // Check if this is a volume viewport for a large series
            if (type === 'volume' && displaySet && displaySet.instances) {
              const sliceCount = displaySet.instances.length;
              
              if (sliceCount > LARGE_SERIES_THRESHOLD) {
                console.log(`Large series detected: ${sliceCount} slices, applying volume limiting`);
                
                // Show user notification
                showVolumeOptimizationNotice(sliceCount, VOLUME_SLICE_LIMIT);
                
                // Create modified display set for volume rendering
                const volumeDisplaySet = createVolumeOptimizedDisplaySet(displaySet, sliceCount);
                
                // Store mapping for cleanup
                processedSeries.set(displaySetInstanceUID, {
                  original: displaySet,
                  volumeOptimized: volumeDisplaySet,
                  sliceCount: sliceCount
                });
                
                return originalCreateViewport.call(this, viewportId, type, displaySetInstanceUID, volumeDisplaySet);
              }
            }
            
            // For non-volume viewports or small series, use original
            return originalCreateViewport.call(this, viewportId, type, displaySetInstanceUID, displaySet);
          };
        }
      }
      
      // Also hook into Cornerstone's volume loading if available
      if (window.cornerstone3D) {
        hookCornerstoneVolumeLoading();
      }
      
    } catch (error) {
      console.error('Failed to setup volume interception:', error);
    }
  }
  
  function createVolumeOptimizedDisplaySet(originalDisplaySet, totalSlices) {
    const sampling = calculateSliceSampling(totalSlices, VOLUME_SLICE_LIMIT);
    const selectedIndices = createSubsampledIndices(totalSlices, sampling);
    
    console.log(`Volume optimization: ${totalSlices} -> ${selectedIndices.length} slices (every ${sampling.step})`);
    
    // Create new display set with subsampled instances
    const volumeDisplaySet = {
      ...originalDisplaySet,
      instances: selectedIndices.map(index => originalDisplaySet.instances[index]),
      numImageFrames: selectedIndices.length,
      _volumeOptimized: true,
      _originalSliceCount: totalSlices,
      _samplingInfo: sampling
    };
    
    // Update metadata to reflect subsampling
    if (volumeDisplaySet.metadata) {
      volumeDisplaySet.metadata = {
        ...volumeDisplaySet.metadata,
        _volumeOptimized: true,
        _originalSliceCount: totalSlices
      };
    }
    
    return volumeDisplaySet;
  }
  
  function hookCornerstoneVolumeLoading() {
    try {
      const { volumeLoader } = window.cornerstone3D;
      
      if (volumeLoader && volumeLoader.createAndCacheVolume) {
        const originalCreateVolume = volumeLoader.createAndCacheVolume;
        
        volumeLoader.createAndCacheVolume = function(volumeId, options) {
          console.log('Creating volume:', volumeId, options);
          
          // Check if this volume needs optimization
          const displaySetInstanceUID = options?.displaySetInstanceUID;
          const seriesInfo = processedSeries.get(displaySetInstanceUID);
          
          if (seriesInfo && seriesInfo.volumeOptimized) {
            console.log('Using volume-optimized display set for:', volumeId);
            
            // Update options to use optimized display set
            const optimizedOptions = {
              ...options,
              displaySet: seriesInfo.volumeOptimized
            };
            
            return originalCreateVolume.call(this, volumeId, optimizedOptions);
          }
          
          return originalCreateVolume.call(this, volumeId, options);
        };
      }
    } catch (error) {
      console.error('Failed to hook Cornerstone volume loading:', error);
    }
  }
  
  // UI feedback for volume optimization
  function showVolumeOptimizationNotice(originalCount, optimizedCount) {
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: rgba(0, 123, 255, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 10000;
      max-width: 320px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.2);
    `;
    
    notice.innerHTML = `
      <strong>📊 Volume Optimized for Performance</strong><br>
      ${originalCount} slices → ~${optimizedCount} slices<br>
      <small>Stack/MPR views show full resolution</small>
    `;
    
    document.body.appendChild(notice);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 6000);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(interceptVolumeCreation, 1000);
    });
  } else {
    setTimeout(interceptVolumeCreation, 1000);
  }
  
  // Expose configuration for debugging
  window.volumeOptimization = {
    VOLUME_SLICE_LIMIT,
    LARGE_SERIES_THRESHOLD,
    processedSeries,
    calculateSliceSampling,
    createSubsampledIndices
  };
  
})();

// Enhanced title enforcement
(function() {
  const TARGET_TITLE = "iCRco Viewer";
  let titleSet = false;
  
  // Function to set title
  function setTitle() {
    if (document.title !== TARGET_TITLE) {
      document.title = TARGET_TITLE;
      console.log("Title set to:", TARGET_TITLE);
    }
  }
  
  // Set title immediately
  setTitle();
  
  // Set title when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setTitle);
  }
  
  // Set title when fully loaded
  window.addEventListener('load', () => {
    setTimeout(setTitle, 100);
    setTimeout(setTitle, 500);
    setTimeout(setTitle, 1000);
  });
  
  // Watch for title changes with MutationObserver
  const titleElement = document.querySelector('title') || document.getElementsByTagName('title')[0];
  if (titleElement) {
    const observer = new MutationObserver(() => setTitle());
    observer.observe(titleElement, { childList: true, subtree: true });
  }
  
  // Watch for head changes
  const headObserver = new MutationObserver(() => {
    const title = document.querySelector('title');
    if (title && title.textContent !== TARGET_TITLE) {
      setTitle();
    }
  });
  headObserver.observe(document.head, { childList: true, subtree: true });
})(); 

// Remove all existing favicons and replace with empty/transparent one
function removeFavicon() {
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());
    
    // Add empty favicon to prevent browser from requesting default favicon.ico
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAA'; // Blank not Empty data URL
    document.head.appendChild(link);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeFavicon);
} else {
    removeFavicon();
}