/** @type {AppTypes.Config} ActiveJS hopefully*/
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
        href: '/',
      },
        React.createElement('img', {
          src: './logo/test.svg',
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
    // But you can optimize these settings:
    
    // Memory management for better GPU utilization
    rendering: {
      // Use GPU-optimized texture formats
      useNorm16Texture: true,
      
      // Enable progressive loading for large datasets
      progressiveLoading: true,
      
      // Optimize viewport rendering
      strictZSpacingForVolumeViewport: false,
    },
    
    // Cache configuration for GPU memory
    cache: {
      // Adjust based on GPU memory (in bytes)
      maxCacheSize: 2048 * 2048 * 2048, // 8GB
      purgeOnExit: true,
    }
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  }
};

// FORCE TITLE UPDATE - Multiple methods
document.title = "iCRco Viewer";

setTimeout(function() {
  document.title = "iCRco Viewer";
  console.log("Title forced to: iCRco Viewer");
}, 100);

setTimeout(function() {
  document.title = "iCRco Viewer";
}, 1000);

// Watch for any title changes and override them
const observer = new MutationObserver(function(mutations) {
  if (document.title !== "iCRco Viewer") {
    document.title = "iCRco Viewer";
    console.log("Title corrected to: iCRco Viewer");
  }
});

observer.observe(document.querySelector('title') || document.head, {
  childList: true,
  subtree: true
});

// Nuclear option - override title every 100ms until it sticks
let titleFixed = false;
const forceTitle = setInterval(() => {
  if (document.title !== "iCRco Viewer") {
    document.title = "iCRco Viewer";
    console.log("Title forced to iCRco Viewer");
  } else if (!titleFixed) {
    titleFixed = true;
    console.log("Title successfully set to iCRco Viewer");
    // Stop checking after it's been correct for 5 seconds
    setTimeout(() => clearInterval(forceTitle), 5000);
  }
}, 100);

// Also try when DOM is fully loaded
window.addEventListener('load', () => {
  setTimeout(() => {
    document.title = "iCRco Viewer";
    console.log("Title set on window load");
  }, 1000);
});