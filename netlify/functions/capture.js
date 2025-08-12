exports.handler = async (event, context) => {
  // Handle CORS preflight requests
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
    // Extract IP from Netlify headers
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

    const visitorData = {
      ip: visitorIP,
      userAgent: event.headers['user-agent'] || 'unknown',
      referer: event.headers['referer'] || 'direct',
      country: event.headers['x-country'] || 'unknown',
      timestamp: new Date().toISOString(),
      method: 'server-side-netlify'
    };

    // Send to your existing analytics endpoint
    const response = await fetch('https://inference.blinkin.io/analytics', {
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
        ip: visitorIP 
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 200,
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
