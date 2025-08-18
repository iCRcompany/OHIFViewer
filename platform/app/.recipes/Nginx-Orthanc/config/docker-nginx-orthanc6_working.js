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
    // GPU acceleration is enabled by default in v3
	maxCacheSize: 512 * 1024 * 1024, // 8GB
    useWebWorkers: true,
    
    // GPU and rendering settings
    enableGPURendering: true,
    preferSizeOverAccuracy: true,
    strictZSpacingForVolumeViewport: false,
    
    // WebGL settings for large datasets
    maxTextureSize: 256, // Reduce from default 4096
    useWebGL2: false,
	volumeRendering: {
      downsampleFactor: 8, // This alone reduces memory by 8x (2³)
	  targetBitDepth: 8,              // 4-bit color depth
	  spatialDownsample: 4,
	  // Limit concurrent processing
      // maxConcurrentRequests: 2,
	  // Enable streaming
      // enableStreaming: true,
      // streamingChunkSize: 32 * 1024 * 1024, // 32MB chunks
	  // emergencyMode: true
	  enableLOD: true,
      maxSlices: 250, // Limit slices processed
	}   
  },
  maxConcurrentMetadataRequests: 5,
  enableLazyLoading: true,
  enableProgressiveRendering: true,

  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  }
};

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
/*   
  // Periodic check for title changes
  const intervalId = setInterval(() => {
    if (document.title !== TARGET_TITLE) {
      setTitle();
    } else if (!titleSet) {
      titleSet = true;
      // Keep checking for 10 more seconds after first success
      setTimeout(() => clearInterval(intervalId), 10000);
    }
  }, 100); */
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
};