// Service Worker for Solcraft Nexus PWA
// Handles caching, offline functionality, and push notifications

const CACHE_NAME = 'solcraft-nexus-v1.0.0';
const STATIC_CACHE = 'solcraft-static-v1';
const DYNAMIC_CACHE = 'solcraft-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API endpoints to cache
const CACHE_API_ENDPOINTS = [
  '/api/health',
  '/api/analytics/platform',
  '/api/marketplace/categories',
  '/api/payments/packages/tokenization',
  '/api/payments/packages/crypto'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      }),
      // Cache API endpoints
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Pre-caching API endpoints...');
        return Promise.all(
          CACHE_API_ENDPOINTS.map(endpoint => {
            return fetch(endpoint)
              .then(response => {
                if (response.ok) {
                  return cache.put(endpoint, response);
                }
              })
              .catch(err => console.log(`Failed to cache ${endpoint}:`, err));
          })
        );
      })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request, url));
  } else {
    // For non-GET requests, just pass through to network
    event.respondWith(fetch(request));
  }
});

// Handle GET requests with caching strategy
async function handleGetRequest(request, url) {
  // Static files - cache first
  if (STATIC_FILES.some(file => url.pathname.includes(file))) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // API endpoints - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    return networkFirst(request, DYNAMIC_CACHE);
  }
  
  // Images and assets - cache first
  if (request.destination === 'image' || url.pathname.includes('/static/')) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // Default - network first
  return networkFirst(request, DYNAMIC_CACHE);
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future use
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Cache-first failed for:', request.url, error);
    return new Response('Network error', { status: 408 });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Update cache with fresh data
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Serving from network and updating cache:', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Network failed, try cache
    console.log('Network failed, trying cache for:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error and no cache available', { status: 503 });
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Solcraft Nexus',
    icon: '/api/placeholder/192/192',
    badge: '/api/placeholder/96/96',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view-dashboard',
        title: 'View Dashboard',
        icon: '/api/placeholder/96/96'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/api/placeholder/96/96'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Solcraft Nexus', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view-dashboard') {
    // Open dashboard
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncPendingOrders());
  } else if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Sync pending orders when back online
async function syncPendingOrders() {
  try {
    const pendingOrders = await getStoredPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/marketplace/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          console.log('Synced pending order:', order.id);
          await removePendingOrder(order.id);
        }
      } catch (error) {
        console.log('Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Sync analytics data
async function syncAnalyticsData() {
  try {
    // Fetch fresh analytics data
    const response = await fetch('/api/analytics/platform');
    if (response.ok) {
      const data = await response.json();
      
      // Update cache
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/analytics/platform', response.clone());
      
      console.log('Synced analytics data');
    }
  } catch (error) {
    console.log('Failed to sync analytics:', error);
  }
}

// Helper functions for offline storage
async function getStoredPendingOrders() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function removePendingOrder(orderId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing pending order:', orderId);
}

// Message handling (for communication with main app)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    // Cache specific URLs on demand
    const urls = event.data.urls;
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.addAll(urls);
    });
  }
});

console.log('Service Worker script loaded');