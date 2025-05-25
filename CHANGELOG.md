# Changelog

Alla betydande ändringar i detta projekt kommer att dokumenteras i denna fil.

## [2024-03-19]

### Lagt till
- Admin-funktionalitet med rollbaserad åtkomst
- Ny projekt-hanteringssida (endast synlig för admin)
- Projekt-länk i navbaren för admin-användare
- Role-kolumn i profiles-tabellen för att hantera admin-behörighet

### Fixat
- Projektnamn visas nu korrekt i kalendervyn
- Förbättrad hantering av projekt-lookup i tidrapporter

### Tekniska detaljer
- Lagt till role-kolumn i profiles-tabellen med default 'user'
- Implementerat projekt-lookup i HomePage.jsx för att visa korrekta projektnamn
- Uppdaterat Navbar.jsx för att visa projekt-länk endast för admin-användare

## Kommande ändringar
- [ ] Förbättra felhantering
- [ ] Lägga till fler admin-funktioner
- [ ] Förbättra användargränssnittet ytterligare 