const path = require('path');
const fs = require('fs');

async function main(){
  // require compiled util from dist
  const utilPath = path.join(__dirname, '..', 'dist', 'util');
  let util;
  try{
    util = require(utilPath);
  }catch(err){
    console.error('Could not require', utilPath, err.message);
    process.exit(1);
  }

  if (!util.loadTemplate) {
    console.error('loadTemplate not found in', utilPath);
    process.exit(1);
  }

  try{
    const html = await util.loadTemplate('order-update-notification', {
      customerName: 'Jane Customer',
      orderId: 'ORD-2025-1001',
      status: 'Shipped',
      orderUrl: 'https://dpmsign.netlify.app/orders/ORD-2025-1001'
    });

    const outDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'order-update-preview.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Wrote preview to', outPath);
  }catch(err){
    console.error('Error rendering template:', err);
    process.exit(1);
  }
}

main();
