const CACHE_NAME = 'arbetstid-cache-v1';

// Funktion för att kontrollera om en URL ska cachas
function shouldCache(url) {
  try {
    // Ignorera ogiltiga URL:er
    if (!url || typeof url !== 'string') {
      console.log('Ignorerar ogiltig URL:', url);
      return false;
    }

    // Ignorera chrome-extension URL:er direkt
    if (url.startsWith('chrome-extension://')) {
      console.log('Ignorerar chrome-extension URL:', url);
      return false;
    }

    const urlObj = new URL(url);
    
    // Ignorera icke-HTTP(S) URL:er
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.log('Ignorerar icke-HTTP(S) URL:', url);
      return false;
    }
    
    // Ignorera externa resurser
    if (urlObj.origin !== self.location.origin) {
      console.log('Ignorerar extern URL:', url);
      return false;
    }
    
    // Ignorera specifika sökvägar
    const ignoredPaths = [
      '/service-worker.js',
      '/manifest.json',
      '/offline.html'
    ];
    
    if (ignoredPaths.some(path => urlObj.pathname === path)) {
      console.log('Ignorerar specifik sökväg:', url);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Fel vid URL-kontroll:', error, 'URL:', url);
    return false;
  }
}

// Installera Service Worker och cachelagra grundläggande filer
self.addEventListener('install', (event) => {
  console.log('Service Worker installeras...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Öppnade cache');
        const urlsToCache = [
          '/',
          '/index.html',
          '/manifest.json',
          '/offline.html'
        ];
        
        return Promise.all(
          urlsToCache.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  console.log('Cachelagrar:', url);
                  return cache.put(url, response);
                }
                throw new Error(`Kunde inte cachelagra ${url}`);
              })
              .catch(error => {
                console.error(`Fel vid cachelagring av ${url}:`, error);
              })
          )
        );
      })
      .catch(error => {
        console.error('Fel vid cache-installation:', error);
      })
  );
});

// Aktivera Service Worker och rensa gamla cache
self.addEventListener('activate', (event) => {
  console.log('Service Worker aktiveras...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Tar bort gammal cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Hantera fetch-förfrågningar
self.addEventListener('fetch', (event) => {
  // Kontrollera om förfrågan ska cachas
  if (!shouldCache(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Returnera cachad respons om den finns
        if (response) {
          console.log('Returnerar cachad respons för:', event.request.url);
          return response;
        }

        // Annars gör en nätverksförfrågan
        return fetch(event.request)
          .then((response) => {
            // Kontrollera om vi fick en giltig respons
            if (!response || response.status !== 200 || response.type !== 'basic') {
              console.log('Ogiltig respons för:', event.request.url);
              return response;
            }

            // Klona responsen eftersom den bara kan användas en gång
            const responseToCache = response.clone();

            // Cachelagra den nya responsen
            caches.open(CACHE_NAME)
              .then((cache) => {
                if (shouldCache(event.request.url)) {
                  console.log('Cachelagrar ny respons för:', event.request.url);
                  cache.put(event.request, responseToCache);
                }
              })
              .catch(error => {
                console.error('Fel vid cache-lagring:', error);
              });

            return response;
          })
          .catch(error => {
            console.error('Fel vid nätverksförfrågan:', error);
            // Returnera offline-sidan om det finns
            return caches.match('/offline.html');
          });
      })
  );
});

// Hantera meddelanden från klienten
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_REMINDER') {
    const { reminderType, time, userId } = event.data;
    
    // Spara påminnelsen i IndexedDB
    saveReminder(reminderType, time, userId)
      .then(() => {
        console.log('Påminnelse schemalagd:', reminderType, time);
      })
      .catch(error => {
        console.error('Fel vid schemaläggning av påminnelse:', error);
      });
  }
});

// Funktion för att spara påminnelse i IndexedDB
async function saveReminder(type, time, userId) {
  const db = await openDatabase();
  const tx = db.transaction('reminders', 'readwrite');
  const store = tx.objectStore('reminders');
  
  await store.add({
    type,
    time,
    userId,
    createdAt: new Date().toISOString()
  });
}

// Funktion för att öppna IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ArbetstidDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Kontrollera påminnelser varje minut
setInterval(async () => {
  const now = new Date();
  const db = await openDatabase();
  const tx = db.transaction('reminders', 'readonly');
  const store = tx.objectStore('reminders');
  const reminders = await store.getAll();
  
  reminders.forEach(reminder => {
    const reminderTime = new Date(reminder.time);
    if (reminderTime <= now) {
      // Skicka notifikation
      self.registration.showNotification('Arbetstid', {
        body: getReminderMessage(reminder.type),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
          type: reminder.type,
          userId: reminder.userId
        }
      });
      
      // Ta bort påminnelsen om den är engångs
      if (reminder.type !== 'daily' && reminder.type !== 'weekly') {
        store.delete(reminder.id);
      }
    }
  });
}, 60000);

// Funktion för att hämta meddelande baserat på påminnelsetyp
function getReminderMessage(type) {
  switch (type) {
    case 'daily':
      return 'Glöm inte att registrera dina arbetstimmar idag!';
    case 'weekly':
      return 'Det är dags att skicka in din tidrapport för veckan!';
    default:
      return 'Påminnelse från Arbetstid';
  }
}

// Hantera push-notifikationer
self.addEventListener('push', (event) => {
  console.log('Push-notifikation mottagen');
  
  const options = {
    body: event.data ? event.data.text() : 'Ny notifikation',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Öppna appen'
      },
      {
        action: 'close',
        title: 'Stäng'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Arbetstid', options)
      .catch(error => {
        console.error('Fel vid visning av notifikation:', error);
      })
  );
});

// Hantera klick på notifikationer
self.addEventListener('notificationclick', (event) => {
  console.log('Notifikation klickad:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
        .catch(error => {
          console.error('Fel vid öppning av fönster:', error);
        })
    );
  }
}); 