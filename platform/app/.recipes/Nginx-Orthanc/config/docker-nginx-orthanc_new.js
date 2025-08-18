/** @type {AppTypes.Config} */
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
  },
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  }
};

// Set initial title
document.title = "iCRco Viewer";

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
  
  // Periodic check for title changes
  const intervalId = setInterval(() => {
    if (document.title !== TARGET_TITLE) {
      setTitle();
    } else if (!titleSet) {
      titleSet = true;
      // Keep checking for 10 more seconds after first success
      setTimeout(() => clearInterval(intervalId), 10000);
    }
  }, 100);
  
  // Override document.title setter
  const originalTitleSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'title').set;
  Object.defineProperty(document, 'title', {
    set: function(value) {
      if (value !== TARGET_TITLE) {
        console.log("Intercepted title change attempt:", value, "-> keeping:", TARGET_TITLE);
        originalTitleSetter.call(this, TARGET_TITLE);
      } else {
        originalTitleSetter.call(this, value);
      }
    },
    get: function() {
      return TARGET_TITLE;
    }
  });
})();