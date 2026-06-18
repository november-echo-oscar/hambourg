// Nom du cache pour cette version de l'application
const CACHE_NAME = 'hamburg-explorer-v1';

// Liste des ressources à mettre en cache pour le fonctionnement hors-ligne
const ASSETS_TO_CACHE = [
  './hamburg_tour.html',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/lucide@latest',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap'
];

// Étape d'installation : on pré-met en cache les ressources stratégiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Mise en cache des ressources statiques lancée');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Étape d'activation : on nettoie les anciens caches obsolètes si besoin
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de réseau : Cache-First pour les fichiers statiques mis en cache
self.addEventListener('fetch', (event) => {
  // On ne met pas en cache les requêtes vers Firebase ou Firestore (qui gèrent leur propre mode hors-ligne)
  if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Retourne le fichier du cache s'il existe
        }
        
        // Sinon, on va chercher sur le réseau
        return fetch(event.request).then((response) => {
          // On ne met en cache que les requêtes réussies (status 200)
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // On clone la réponse pour la sauvegarder dans le cache pour la prochaine fois
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      }).catch(() => {
        // Optionnel : tu pourrais renvoyer une page d'erreur personnalisée ici si le réseau échoue
      })
  );
});