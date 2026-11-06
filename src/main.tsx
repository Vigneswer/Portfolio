import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Full-document links keep the two designs' global CSS and runtime effects isolated.
const classic = /^\/classic\/?$/.test(window.location.pathname);
const { default: Application } = await (classic ? import("./Classic") : import("./studio"));
createRoot(document.getElementById("root")!).render(<StrictMode><Application /></StrictMode>);
