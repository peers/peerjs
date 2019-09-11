declare module 'webrtc-adapter' {
  interface BrowserDetails {
    browser: 'Not a browser.' | 'Not a supported browser.' | 'firefox' | 'chrome' | 'safari' | 'edge',
    version: number | null,
    supportsUnifiedPlan?: boolean
  }

  interface Adapter {
    browserDetails: BrowserDetails;
  }

  var adapter: Adapter;

  export default adapter;
}