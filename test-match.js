const fs = require('fs');
const path = require('path');

const LOCAL_CSV_PATH = path.resolve(__dirname, 'backend/src/scripts/2025_34-province-3221-ward_with_location.csv');

function clean(s) {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\btinh\b/g, '')
    .replace(/\bthanh pho\b/g, '')
    .replace(/\btp\b/g, '')
    .replace(/\bquan\b/g, '')
    .replace(/\bhuyen\b/g, '')
    .replace(/\bphuong\b/g, '')
    .replace(/\bxa\b/g, '')
    .replace(/\bthitran\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  
  const getIndex = (names) => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const pIdx = getIndex(['province', 'newProvince']);
  const psIdx = getIndex(['provinceShort', 'newProvinceShort', 'province']);
  const wIdx = getIndex(['ward', 'newWard']);
  const wsIdx = getIndex(['wardShort', 'newWardShort', 'ward']);
  const platIdx = getIndex(['provinceLat', 'newProvinceLat']);
  const plonIdx = getIndex(['provinceLon', 'newProvinceLon']);
  const wlatIdx = getIndex(['wardLat', 'newWardLat']);
  const wlonIdx = getIndex(['wardLon', 'newWardLon']);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(',');
    if (cols.length < headers.length) continue;

    rows.push({
      province: cols[pIdx] || '',
      provinceShort: psIdx !== -1 ? cols[psIdx] || '' : '',
      ward: cols[wIdx] || '',
      wardShort: wsIdx !== -1 ? cols[wsIdx] || '' : '',
      provinceLat: parseFloat(cols[platIdx]),
      provinceLon: parseFloat(cols[plonIdx]),
      wardLat: parseFloat(cols[wlatIdx]),
      wardLon: parseFloat(cols[wlonIdx])
    });
  }
  return rows;
}

function test() {
  const csvText = fs.readFileSync(LOCAL_CSV_PATH, 'utf-8');
  const csvRows = parseCSV(csvText);
  
  const cleanExpectedProv = clean("Hà Giang");
  console.log('Cleaned "Hà Giang":', cleanExpectedProv);

  const matched = csvRows.filter(row => {
    const cleanRowProv = clean(row.province || row.provinceShort || '');
    const isMatch = cleanRowProv === cleanExpectedProv || cleanRowProv.includes(cleanExpectedProv) || cleanExpectedProv.includes(cleanRowProv);
    if (isMatch) {
      console.log('Matched row:', row.province, 'short:', row.provinceShort, 'cleanRowProv:', cleanRowProv);
    }
    return isMatch;
  });

  console.log('Total matched rows for "Hà Giang":', matched.length);
}

test();
