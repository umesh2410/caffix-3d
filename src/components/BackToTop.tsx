"use client";

import { scrollToTop } from "@/components/SmoothScroll";

export default function BackToTop() {
  return (
    <button type="button" className="to-top" onClick={scrollToTop}>
      Back to top <span aria-hidden="true">↑</span>
    </button>
  );
}
