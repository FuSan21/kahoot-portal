declare global {
  interface Window {
    google: typeof import("google-one-tap");
  }
  var google: typeof import("google-one-tap");
}
