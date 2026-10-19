// Crops a picked photo to a square and shrinks it so it fits comfortably in the database.

import { t } from './i18n.js';

async function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error(t('photo.notImage'));
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(t('photo.cantOpen')));
      el.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Lesson photos: keep the shape, longest side at most maxSide pixels.
export async function resizeImage(file, maxSide = 1280) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function resizePhoto(file, size = 320) {
  if (!file || !file.type.startsWith('image/')) throw new Error(t('photo.notImage'));
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(t('photo.cantOpen')));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
