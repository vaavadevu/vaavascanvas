exports.handler = async () => {
  const response = await fetch('https://product.gelatoapis.com/v3/catalogs', {
    headers: { 'X-API-KEY': process.env.GELATO_API_KEY }
  });
  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2)
  };
};