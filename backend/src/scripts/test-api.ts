import fetch from 'node-fetch'; // If node-fetch is not installed, we can use global fetch (since Node 18 has native fetch)

async function test() {
  const url = 'http://localhost:8000/api/v1/address/parse';
  const testAddresses = [
    { address: 'Phường Lý Thái Tổ, Quận Hoàn Kiếm, Thành phố Hà Nội', mode: 'LEGACY' },
    { address: 'Phường Lý Thái Tổ, Quận Hoàn Kiếm, Thành phố Hà Nội', mode: 'FROM_2025' },
    { address: 'Hà Nội', mode: 'LEGACY' },
    { address: 'Hà Nội', mode: 'FROM_2025' },
    { address: 'Thành phố Hà Nội', mode: 'LEGACY' },
    { address: 'Thành phố Hà Nội', mode: 'FROM_2025' },
    { address: 'Phường 1, Tỉnh Bến Tre', mode: 'LEGACY' },
    { address: 'Phường 1, Bến Tre', mode: 'LEGACY' }
  ];

  console.log('=== STARTING API DIAGNOSTICS ===');
  for (const item of testAddresses) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      console.log(`\nQuery: "${item.address}" (mode: ${item.mode})`);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text}`);
    } catch (err: any) {
      console.error(`Error querying "${item.address}":`, err.message);
    }
  }
}

test();
