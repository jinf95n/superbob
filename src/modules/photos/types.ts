import { z } from "zod";

export const MAX_PORTFOLIO_PHOTOS = 10;

export const DeletePortfolioPhotoSchema = z.object({
  photoId: z.string().uuid(),
});

export type DeletePortfolioPhotoInput = z.infer<typeof DeletePortfolioPhotoSchema>;

export type PortfolioPhotoItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
};

export type UploadPortfolioPhotoActionState = {
  error?: string;
  photo?: PortfolioPhotoItem;
};

export type DeletePortfolioPhotoActionState = {
  error?: string;
};
