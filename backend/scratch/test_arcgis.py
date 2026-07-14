import urllib.request
import urllib.parse
import json

def test_geocode(query):
    encoded = urllib.parse.quote(query)
    url = f"https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine={encoded}&maxLocations=1"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get('candidates'):
                candidate = data['candidates'][0]
                print(f"Query: {query}")
                print(f"Match: {candidate['address']}")
                print(f"Coords: {candidate['location']}\n")
                return candidate
            else:
                print(f"Query: {query} -> NOT FOUND\n")
    except Exception as e:
        print(f"Error for {query}: {e}\n")

if __name__ == '__main__':
    test_geocode("Azerai Cần Thơ, Cần Thơ, Vietnam")
    test_geocode("Chùa Pôthi Sômrôn, Cần Thơ, Vietnam")
    test_geocode("Làng nghề bánh tráng Thuận Hưng, Cần Thơ, Vietnam")
    test_geocode("Quán Vịt nấu chao Thành Giao, Cần Thơ, Vietnam")
    test_geocode("Muong Thanh Luxury Can Tho Hotel, Cần Thơ, Vietnam")
