"use client";

import { useEffect, useState } from "react";

export function RefreshBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 160);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="fixed inset-x-4 top-4 z-40 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-1/2 sm:w-auto sm:-translate-x-1/2"
    >
      Rafraîchir la page
    </button>
  );
}
