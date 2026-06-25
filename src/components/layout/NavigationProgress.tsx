"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 200;
const LOADING_TARGET_WIDTH = 70;
const LOADING_DURATION_MS = 400;
const COMPLETE_DURATION_MS = 200;
const FADE_OUT_DURATION_MS = 300;

/**
 * Barra de progreso de navegación sin librerías externas. No hay un evento
 * nativo de "el router empezó a navegar", así que detectamos el inicio
 * escuchando clicks en links internos (y popstate para atrás/adelante) a
 * nivel documento, y detectamos el final cuando usePathname() cambia
 * (la nueva página ya renderizó).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const isNavigatingRef = useRef(false);
  const hasShownRef = useRef(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }

    function startNavigation() {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      hasShownRef.current = false;
      clearTimers();
      setFading(false);
      setWidth(0);

      // Si la navegación termina antes de SHOW_DELAY_MS, esto nunca llega a
      // ejecutarse (lo cancela el efecto de pathname) y la barra no aparece.
      showTimeoutRef.current = setTimeout(() => {
        hasShownRef.current = true;
        setVisible(true);
        requestAnimationFrame(() => setWidth(LOADING_TARGET_WIDTH));
      }, SHOW_DELAY_MS);
    }

    function isInternalNavigationAnchor(anchor: HTMLAnchorElement): boolean {
      if (anchor.target && anchor.target !== "_self") return false;
      if (anchor.hasAttribute("download")) return false;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return false;

      try {
        const url = new URL(anchor.href, window.location.href);
        return (
          url.origin === window.location.origin &&
          (url.pathname !== window.location.pathname ||
            url.search !== window.location.search)
        );
      } catch {
        return false;
      }
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || !isInternalNavigationAnchor(anchor)) return;

      startNavigation();
    }

    function handlePopState() {
      startNavigation();
    }

    // Capture, no bubbling: next/link llama a event.preventDefault() para
    // navegar del lado del cliente, así que si escucháramos en la fase de
    // bubbling el evento ya llegaría con defaultPrevented=true y nuestro
    // propio chequeo de defaultPrevented lo descartaría siempre.
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = false;

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (!hasShownRef.current) {
      // Navegación más rápida que SHOW_DELAY_MS: nunca se mostró, no hay
      // flash que evitar.
      setWidth(0);
      return;
    }

    setWidth(100);
    hideTimeoutRef.current = setTimeout(() => {
      setFading(true);
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
        setFading(false);
        setWidth(0);
        hasShownRef.current = false;
      }, FADE_OUT_DURATION_MS);
    }, COMPLETE_DURATION_MS);
    // Solo nos interesa reaccionar al cambio de pathname en sí, no a los
    // estados internos que esta misma navegación va actualizando.
  }, [pathname]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[9999] h-[3px] bg-sb-blue"
      style={{
        width: `${width}%`,
        opacity: fading ? 0 : 1,
        transition: `width ${
          width === 100 ? COMPLETE_DURATION_MS : LOADING_DURATION_MS
        }ms ease-out, opacity ${FADE_OUT_DURATION_MS}ms ease-out`,
      }}
    />
  );
}
