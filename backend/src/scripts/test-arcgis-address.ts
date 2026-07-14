async function test() {
  const title = "Chùa Chuông";
  const province = "Hưng Yên";
  
  // Coords for Chùa Chuông in JSON:
  const lat = 20.6557859;
  const lng = 106.0504457;

  console.log("--- 1. Testing Forward Geocoding (with outFields=*) ---");
  const encoded = encodeURIComponent(`${title}, ${province}, Vietnam`);
  const url1 = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encoded}&maxLocations=1&outFields=*`;

  try {
    const res = await fetch(url1);
    const data = await res.json() as any;
    if (data.candidates && data.candidates.length > 0) {
      console.log("Candidate Address:", data.candidates[0].address);
      console.log("Attributes:", JSON.stringify(data.candidates[0].attributes, null, 2));
    } else {
      console.log("No forward geocoding candidates found.");
    }
  } catch (err: any) {
    console.error("Forward geocoding error:", err.message);
  }

  console.log("\n--- 2. Testing Reverse Geocoding (location=lng,lat) ---");
  const url2 = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${lng},${lat}`;

  try {
    const res = await fetch(url2);
    const data = await res.json() as any;
    if (data.address) {
      console.log("Reverse Geocoded Address:", JSON.stringify(data.address, null, 2));
    } else {
      console.log("No reverse geocoding address found.");
    }
  } catch (err: any) {
    console.error("Reverse geocoding error:", err.message);
  }
}

test();
