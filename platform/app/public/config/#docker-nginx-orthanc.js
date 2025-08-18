/** @type {AppTypes.Config} this one is commented out...*/
window.config = {
  routerBasename: null,
  showStudyList: true,
  extensions: [],
  modes: [],
  // below flag is for performance reasons, but it might not work for all servers
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
  useNorm16Texture: true,
  appTitle: "iCRco Viewer",
  defaultDataSourceName: 'dicomweb',
  investigationalUseDialog: {
  option: 'never',
  },
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
      return React.createElement(
        'a',
        {
          target: '_self',
          rel: 'noopener noreferrer',
          className: 'text-purple-600 line-through',
          href: 'https://www.icrco.com',  // '/'
        },
        React.createElement('img', {
          src: '/iCRcoLogoSmall.png', //'./customLogo.svg',
		  alt: 'iCRco, Inc.', 
		  // width: '84',
		  // height: '41',
          // className: 'w-8 h-8',
        })
      );
    },
	appTitle: "iCRco Viewer",
  },
  onReady: function() {
	  document.title = "iCRco Viewer"
  },
  // Cornerstone3D configuration
/*   cornerstone: {
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
      maxCacheSize: 1024 * 1024 * 1024, // 1GB
      purgeOnExit: true,
    }
  }, */
  // Enable performance monitoring
  // debug: {
    // enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
    // logGPUMemoryUsage: true
  // },
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  },
};
