export type ImageTag = {
  tagName: string;
  fullImageName: string;
  size: number;
  lastUpdated: string;
  digest: string;
};


export type InstalledImage = {
  id: string;
  tag: string;
  size: number;
  created: string;
  digest: string;
};