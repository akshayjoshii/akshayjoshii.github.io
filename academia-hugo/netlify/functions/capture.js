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
    // Extract IP from multiple possible headers
    const forwardedFor = event.headers['x-forwarded-for'];
    const realIP = event.headers['x-real-ip'];
    const clientIP = event.headers['client-ip'];
    
    let visitorIP = 'unknown';
    if (forwardedFor) {
      visitorIP = forwardedFor.split(',')[0].trim();
    } else if (realIP) {
      visitorIP = realIP;
    } else if (clientIP) {
      visitorIP = clientIP;
    }

    // Comprehensive visitor data collection
    const visitorData = {
      // IP Information
      ip: visitorIP,
      ipSource: forwardedFor ? 'x-forwarded-for' : (realIP ? 'x-real-ip' : 'client-ip'),
      
      // Geographic Information (Netlify provides these)
      country: event.headers['x-country'] || 'unknown',
      countryRegion: event.headers['x-country-region'] || 'unknown',
      city: event.headers['x-city'] || 'unknown',
      timezone: event.headers['x-timezone'] || 'unknown',
      
      // Browser & Device Information  
      userAgent: event.headers['user-agent'] || 'unknown',
      acceptLanguage: event.headers['accept-language'] || 'unknown',
      acceptEncoding: event.headers['accept-encoding'] || 'unknown',
      
      // Traffic Source Information
      referer: event.headers['referer'] || event.headers['referrer'] || 'direct',
      origin: event.headers['origin'] || 'unknown',
      
      // Technical Details
      host: event.headers['host'] || 'unknown',
      protocol: event.headers['x-forwarded-proto'] || 'unknown',
      method: event.httpMethod || 'unknown',
      
      // Connection Information
      connection: event.headers['connection'] || 'unknown',
      upgrade: event.headers['upgrade-insecure-requests'] || 'unknown',
      
      // Additional Netlify-specific headers
      netlifyIP: event.headers['x-nf-client-connection-ip'] || 'unknown',
      netlifyRequestID: event.headers['x-nf-request-id'] || 'unknown',
      
      // Timestamps
      timestamp: new Date().toISOString(),
      serverTimestamp: Date.now(),
      
      // Request Details
      path: event.path || '/',
      queryParams: event.queryStringParameters || {},
      
      // Method identifier
      method: 'server-side-enhanced'
    };

    // Send comprehensive data to your analytics
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
        dataPoints: Object.keys(visitorData).length
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
