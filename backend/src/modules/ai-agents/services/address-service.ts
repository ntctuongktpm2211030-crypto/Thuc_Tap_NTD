export interface AdminUnit {
  province: string;
  district: string;
  ward: string;
  street: string;
  short_province: string;
  short_district: string;
  short_ward: string;
  province_code: number;
  district_code: number;
  ward_code: number;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export class AddressService {
  private baseUrl = 'http://localhost:8000';

  async parseAddress(address: string, mode: 'FROM_2025' | 'LEGACY' = 'FROM_2025'): Promise<AdminUnit | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/address/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, mode })
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      if (data && data.status === 'success') {
        return data;
      }
      return null;
    } catch (err: any) {
      console.error('[AddressService] Error parsing address:', err.message);
      return null;
    }
  }

  async convertAddress(address: string): Promise<AdminUnit | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/address/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      if (data && data.status === 'success') {
        return data;
      }
      return null;
    } catch (err: any) {
      console.error('[AddressService] Error converting address:', err.message);
      return null;
    }
  }
}
