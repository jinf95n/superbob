import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Default de Next.js es 1MB, por debajo del límite de 2MB que validamos
  // en uploadAvatarAction/uploadPortfolioPhotoAction. Sin este margen, un
  // archivo de más de 1MB nunca llega a esas Server Actions: Next lo
  // rechaza antes con un 413 que el cliente no puede convertir en un error
  // de formulario.
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default withPWA(nextConfig);
