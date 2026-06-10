'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import OpenStreetMapPicker from '@/components/maps/OpenStreetMapPicker';

type MapLocationPickerProps = {
  address: string;
  lat: string;
  lng: string;
  onLocationChange: (data: { address: string; lat: string; lng: string }) => void;
};

export default function MapLocationPicker({
  address,
  lat,
  lng,
  onLocationChange,
}: MapLocationPickerProps) {
  const [showMap, setShowMap] = useState(false);

  const latNum = parseFloat(lat) || 10.762622;
  const lngNum = parseFloat(lng) || 106.660172;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      >
        <MapPin size={16} />
        {showMap ? 'Ẩn bản đồ' : 'Chọn vị trí trên bản đồ'}
      </button>

      {showMap && (
        <div className="border rounded-lg overflow-hidden">
          <OpenStreetMapPicker
            initialLocation={{ lat: latNum, lng: lngNum, address }}
            onLocationChange={(location) => {
              onLocationChange({
                address: location.address,
                lat: location.lat.toString(),
                lng: location.lng.toString(),
              });
            }}
            height="400px"
            showSearch={true}
          />
          <div className="bg-slate-50 p-3 text-xs text-slate-600 border-t space-y-2">
            <div>
              <div className="font-medium mb-1">Tọa độ hiện tại:</div>
              <div className="font-mono text-blue-600">
                Lat: {lat}, Lng: {lng}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Hướng dẫn:</div>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Tìm kiếm địa chỉ bằng ô tìm kiếm phía trên</li>
                <li>Hoặc click trực tiếp lên bản đồ để chọn vị trí</li>
                <li>Tọa độ và địa chỉ sẽ tự động cập nhật</li>
                <li className="font-semibold text-amber-600">⚠️ Nhớ nhấn "Lưu thay đổi" ở dưới để lưu vào database!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
