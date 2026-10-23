// FALSEDOOR Root Service Worker for PWA
const CACHE_NAME = 'falsedoor-preview-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass-through
});
