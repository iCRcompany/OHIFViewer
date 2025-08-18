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
    displaySetsCount: 2,
    maxNumPrefetchRequests: 10,
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
    // Conservative cache size
    maxCacheSize: 512 * 1024 * 1024, // 512MB
    useWebWorkers: true,
    
    // GPU and rendering settings
    enableGPURendering: true,
    preferSizeOverAccuracy: true,
    strictZSpacingForVolumeViewport: false,
    
    // WebGL settings for large datasets
    maxTextureSize: 256,
    useWebGL2: false,
  },
  maxConcurrentMetadataRequests: 5,
  enableLazyLoading: true,
  enableProgressiveRendering: true,

  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  }
};

// Dynamic Volume Slice Limiting System
(function() {
  const VOLUME_SLICE_LIMIT = 300;
  const LARGE_SERIES_THRESHOLD = 300;
  
  // Store original volume loading functions
  let originalVolumeLoader = null;
  let originalViewportService = null;
  
  // Track which series have been processed
  const processedSeries = new Map();
  
  // Function to calculate optimal slice sampling
  function calculateSliceSampling(totalSlices, targetSlices) {
    if (totalSlices <= targetSlices) {
      return { step: 1, start: 0, count: totalSlices };
    }
    
    const step = Math.ceil(totalSlices / targetSlices);
    const actualCount = Math.floor(totalSlices / step);
    const start = Math.floor((totalSlices - (actualCount * step)) / 2);
    
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
  
  // Memory monitoring for volume operations
  function monitorVolumeMemory() {
    const checkMemory = () => {
      if (performance.memory) {
        const memInfo = performance.memory;
        const usedPercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          console.warn(`High memory usage: ${usedPercent.toFixed(1)}% - Volume operations may fail`);
          
          // Clear processed series cache if memory is high
          if (usedPercent > 90) {
            console.log('Clearing volume optimization cache due to high memory usage');
            processedSeries.clear();
            
            // Force garbage collection if available
            if (window.gc) {
              window.gc();
            }
          }
        }
      }
    };
    
    // Check memory every 5 seconds during volume operations
    setInterval(checkMemory, 5000);
  }
  
  // UI feedback for volume optimization
  function showVolumeOptimizationNotice(originalCount, optimizedCount) {
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: rgba(0, 100, 200, 0.9);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    notice.innerHTML = `
      <strong>Volume Optimized</strong><br>
      ${originalCount} slices → ${optimizedCount} slices<br>
      <small>MPR/Axial views use full resolution</small>
    `;
    
    document.body.appendChild(notice);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(interceptVolumeCreation, 1000);
      monitorVolumeMemory();
    });
  } else {
    setTimeout(interceptVolumeCreation, 1000);
    monitorVolumeMemory();
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