/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/ohif',
  showStudyList: true,
  extensions: [],
  modes: [],
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement('img', {
        src: '/ohif/assets/icrco-logo.png',
        style: { height: '36px' },
        alt: 'iCRco',
      });
    },
  },
  oidc: [
    {
      // ~ REQUIRED
      authority: 'https://claritypacs.internal/keycloak/realms/dcm4che',
      client_id: 'ohif-viewer',
      redirect_uri: '/callback',
      response_type: 'code', // PKCE, handled automatically by oidc-client-ts
      scope: 'openid',
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
    },
  ],
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Clarity PACS',
        name: 'clarityarchive',
        wadoUriRoot: 'https://claritypacs.internal/dcm4chee-arc/aets/clarityarchive/wado',
        qidoRoot: 'https://claritypacs.internal/dcm4chee-arc/aets/clarityarchive/rs',
        wadoRoot: 'https://claritypacs.internal/dcm4chee-arc/aets/clarityarchive/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        enableStudyLazyLoad: true,
        thumbnailRendering: 'thumbnail',
        thumbnailRequestStrategy: 'fetch',
        supportsWildcard: true,
        dicomUploadEnabled: true,
        singlepart: 'pdf,video',
        bulkDataURI: {
          enabled: true,
        },
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
  studyListFunctionsEnabled: true,
};
