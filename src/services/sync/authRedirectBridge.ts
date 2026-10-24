import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

// Entry point for auth.html (project root). MSAL Browser v5's loginPopup/acquireTokenPopup
// rely on this "redirect bridge" running inside the popup to broadcast the auth response
// back to the opener over a BroadcastChannel - without it, the opener just waits until it
// times out ("timed_out" / redirect_bridge_timeout), which is why a truly blank redirect
// page never worked. See node_modules/@azure/msal-browser/lib/msal-browser/docs/redirect-bridge.md.
broadcastResponseToMainFrame().catch((error) => {
    console.error("Error broadcasting OneDrive auth response", error);
});
