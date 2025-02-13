// add your API key here
const wiener_linien_api_key = 'XXXXXXXX';

// define all RBLs of stops you want to display
const wiener_linien_api_ids = [
  "252",    // Rathaus – 2 (Richtung Friedrich-Engels-Platz)
  "269",    // Rathaus – 2 (Richtung Ottakringer Str./Erdbrustgasse)
  "4205",   // Rathaus – U2 (Richtung Karlsplatz)
  "4210",   // Rathaus – U2 (Richtung Seestadt)
  "1346",   // Landesgerichtsstraße – 43, 44, N43 (stadtauswärts)
  "1212",   // Schottentor – 37, 38, 40, 41, 42 (stadtauswärts)
  "1303",   // Schottentor — 40A (stadtauswärts)
  "3701",   // Schottentor – N38 (stadtauswärts, nur am Wochenende)
  "5568",   // Schottentor – N41 (stadtauswärts)
  "17",     // Rathausplatz/Burgtheater – D, 1, 71, N25, N38, N60, N66 (Richtung Schottentor, Nachtbusse nur wochentags)
  "48",     // Stadiongasse/Parlament – D, 1, 71 (Richtung Volkstheater)
  "16",     // Stadiongasse/Parlament – D, 1, 2, 71 (Richtung Schottentor)
  "1401",   // Volkstheater – 48A (stadtauswärts)
  "1440",   // Volkstheater – 49 (stadtauswärts)
  "4908",   // Volkstheater – U3 (Richtung Ottakring)
  "4909",   // Volkstheater – U3 (Richtung Simmering)
  "1376",   // Auerspergstraße – 46 (stadtauswärts)
  "5691",   // Auerspergstraße – N46 (stadtauswärts)
];

const wiener_linien_api_url = 'http://www.wienerlinien.at/ogd_realtime/monitor' +
  '?activateTrafficInfo=stoerunglang' +
  `&sender=${wiener_linien_api_key}`+
  '&rbl=' + wiener_linien_api_ids.join("&rbl=");

// define filters to exclude specific departures from the monitor
// currently you can exclude lines as a whole or only at certain stops
const wiener_linien_filters = [
  {
    line: ['VRT'],  // excludes whole line (VRT = tourist line)
  },
  {
    line: ['D', '1', '71'],
    stop: ['Rathausplatz/Burgtheater'], // excludes lines only at given stop
  },
  {
    line: ['2'],
    stop: ['Stadiongasse/Parlament'],
  },
];

const oebb_api_ids = [
  '001290302' // Wien Mitte-Landstraße Bahnhof (U)
]

const oebb_product_filter = "0000110000000000"; // S-Bahn and Trains

// define your current location
// const location_coordinate = 'xx.xxxxxxx,xx.xxxxxxx'

// define OSRM server for routing to stops. Empty string to disable feature
// const osrm_api_url = 'http://router.project-osrm.org/route/v1/foot/' + location_coordinate + ';'
const osrm_api_url = ''

// define a static fallback walk duration
const fallback_walk_duration = 120

module.exports = {
  'wiener_linien_api_url' : wiener_linien_api_url,
  'wiener_linien_filters' : wiener_linien_filters,
  'api_cache_msec'        : 6000,   // cache API responses for this many milliseconds; default: 6s
  'listen_port'           : process.env.PORT || 8080,   // port to listen on
  'osrm_api_url'          : osrm_api_url,
  'oebb_api_ids'          : oebb_api_ids,
  'oebb_product_filter'   : oebb_product_filter,
  'fallback_walk_duration'  : fallback_walk_duration
};