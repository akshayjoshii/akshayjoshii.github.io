exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // CORRECTED: Proper IP extraction order for Cloudflare/Netlify
    let visitorIP = 'unknown';
    let ipSource = 'unknown';
    
    // Check headers in the correct priority order
    if (event.headers['cf-connecting-ip']) {
      // Cloudflare's real visitor IP header (most reliable)
      visitorIP = event.headers['cf-connecting-ip'];
      ipSource = 'cf-connecting-ip';
    } else if (event.headers['x-forwarded-for']) {
      // Parse x-forwarded-for correctly (first IP is the real visitor)
      const forwardedIPs = event.headers['x-forwarded-for'].split(',');
      visitorIP = forwardedIPs[0].trim();
      ipSource = 'x-forwarded-for';
    } else if (event.headers['x-real-ip']) {
      visitorIP = event.headers['x-real-ip'];
      ipSource = 'x-real-ip';
    } else if (event.headers['x-client-ip']) {
      visitorIP = event.headers['x-client-ip'];
      ipSource = 'x-client-ip';
    }

    const visitorData = {
      // Use the correctly extracted IP
      ip: visitorIP,
      ipSource: ipSource,
      
      // Add all the IPs for debugging
      debug_all_ips: {
        'cf-connecting-ip': event.headers['cf-connecting-ip'] || 'not_present',
        'x-forwarded-for': event.headers['x-forwarded-for'] || 'not_present', 
        'x-real-ip': event.headers['x-real-ip'] || 'not_present',
        'x-client-ip': event.headers['x-client-ip'] || 'not_present'
      },
      
      // Geographic data
      country: event.headers['cf-ipcountry'] || event.headers['x-country'] || 'unknown',
      countryRegion: event.headers['x-country-region'] || 'unknown',
      city: event.headers['x-city'] || 'unknown',
      timezone: event.headers['x-timezone'] || 'unknown',
      
      // Browser and device data  
      userAgent: event.headers['user-agent'] || 'unknown',
      acceptLanguage: event.headers['accept-language'] || 'unknown',
      
      // Traffic source
      referer: event.headers['referer'] || event.headers['referrer'] || 'direct',
      
      // Technical details
      host: event.headers['host'] || 'unknown',
      protocol: event.headers['x-forwarded-proto'] || 'unknown',
      
      // Timestamps
      timestamp: new Date().toISOString(),
      
      // Method identifier
      method: 'server-side-fixed-ip'
    };

    // Send to analytics
    await fetch('https://inference.blinkin.io/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visitorData)
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        ip: visitorIP,
        source: ipSource
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};
