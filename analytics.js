// Sistem analytics sederhana

// Konfigurasi
const ANALYTICS_ENDPOINT = 'https://example.com/api/analytics'; // Ganti dengan URL API endpoint Anda
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 menit dalam milidetik

// Data analytics
let analyticsData = {
    sessionId: generateSessionId(),
    startTime: new Date(),
    lastActive: new Date(),
    pageViews: 0,
    events: [],
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || navigator.userLanguage,
    path: window.location.pathname
};

// Menghasilkan ID sesi unik
function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Menghasilkan token pengunjung unik (disimpan di localStorage)
function getOrCreateVisitorToken() {
    let token = localStorage.getItem('visitorToken');
    if (!token) {
        token = 'vt-' + generateSessionId();
        localStorage.setItem('visitorToken', token);
    }
    return token;
}

// Lacak tampilan halaman
function trackPageView() {
    analyticsData.pageViews++;
    analyticsData.lastActive = new Date();
    saveAnalyticsLocally();
}

// Lacak event
function trackEvent(category, action, label, value) {
    analyticsData.events.push({
        timestamp: new Date(),
        category,
        action,
        label,
        value
    });
    analyticsData.lastActive = new Date();
    saveAnalyticsLocally();
}

// Simpan analytics ke localStorage sementara
function saveAnalyticsLocally() {
    localStorage.setItem('analyticsData', JSON.stringify(analyticsData));
}

// Kirim data ke server
function sendAnalyticsToServer() {
    // Tambahkan visitor token ke data
    const dataToSend = {
        ...analyticsData,
        visitorToken: getOrCreateVisitorToken(),
        duration: new Date() - analyticsData.startTime
    };
    
    // Gunakan navigator.sendBeacon jika ada, atau fallback ke fetch
    if (navigator.sendBeacon) {
        navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(dataToSend));
    } else {
        fetch(ANALYTICS_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(dataToSend),
            headers: {
                'Content-Type': 'application/json'
            },
            keepalive: true
        }).catch(err => console.error('Analytics error:', err));
    }
}

// Setup tracking
function setupAnalytics() {
    // Lacak tampilan halaman
    trackPageView();
    
    // Lacak klik pada link
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target) {
            trackEvent('Engagement', 'Click', target.href || 'Unknown Link');
        }
    });
    
    // Lacak scroll
    let scrollDepthMarkers = [25, 50, 75, 100];
    let markedScrollDepths = [];
    
    window.addEventListener('scroll', function() {
        const scrollDepth = Math.floor((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        scrollDepthMarkers.forEach(function(marker) {
            if (scrollDepth >= marker && !markedScrollDepths.includes(marker)) {
                markedScrollDepths.push(marker);
                trackEvent('Engagement', 'Scroll Depth', `${marker}%`);
            }
        });
    });
    
    // Lacak waktu di halaman
    let timeOnPageMarkers = [10, 30, 60, 120, 300]; // dalam detik
    let markedTimeOnPage = [];
    let timeOnPageInterval = setInterval(function() {
        const secondsOnPage = Math.floor((new Date() - analyticsData.startTime) / 1000);
        
        timeOnPageMarkers.forEach(function(marker) {
            if (secondsOnPage >= marker && !markedTimeOnPage.includes(marker)) {
                markedTimeOnPage.push(marker);
                trackEvent('Engagement', 'Time on Page', `${marker} seconds`);
            }
        });
    }, 1000);
    
    // Kirim data saat pengguna meninggalkan halaman
    window.addEventListener('beforeunload', function() {
        clearInterval(timeOnPageInterval);
        sendAnalyticsToServer();
    });
}

// Inisialisasi analytics
document.addEventListener('DOMContentLoaded', setupAnalytics); 