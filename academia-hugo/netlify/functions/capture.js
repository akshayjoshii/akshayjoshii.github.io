exports.handler = async () => ({
  statusCode: 410,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify({ error: 'capture_endpoint_retired' })
});
