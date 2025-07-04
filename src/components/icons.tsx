import * as React from "react";

export const LeafIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M11 20A7 7 0 0 1 4 13V7a1 1 0 0 1 1-1h1a3 3 0 0 0 3-3V2" />
    <path d="M11 20a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1h-1" />
    <path d="M11 20a10 10 0 0 0 10-10V7" />
    <path d="M13 10a1 1 0 0 0 1-1V3" />
  </svg>
);
