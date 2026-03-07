import { useEffect, useRef } from "react";
import Map, { Marker } from 'react-map-gl/maplibre';
import "maplibre-gl/dist/maplibre-gl.css";

export interface LocationPickerProps {
	value?: { latitude: number; longitude: number } | null;
	onChange: (coords: { latitude: number; longitude: number } | null) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
	const mapRef = useRef<any>(null);

	useEffect(() => {
		if (!value) {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(pos) => {
						mapRef.current?.flyTo({
							center: [pos.coords.longitude, pos.coords.latitude],
							zoom: 15,
						});
					},
					undefined,
					{ enableHighAccuracy: true }
				);
			}
		}
	}, [value]);

	const handleMapClick = (e: any) => {
		onChange({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
	};

	console.log("LocationPicker render", { value });

	return (
		<div style={{ width: "100%", height: 320, borderRadius: 12, overflow: "hidden" }}>
			<Map
				ref={mapRef}
				initialViewState={{
					latitude: value?.latitude ?? 10.4806,
					longitude: value?.longitude ?? -66.9036,
					zoom: 14,
				}}
				mapStyle="https://tiles.stadiamaps.com/styles/osm_bright.json"
				mapLib={import("maplibre-gl")}
				onClick={handleMapClick}
			>
				{value && <Marker latitude={value.latitude} longitude={value.longitude} />}
			</Map>
			<div className="flex gap-2 mt-2">
				<button
					type="button"
					className="text-xs text-red-500 underline"
					onClick={() => onChange(null)}
				>
					Limpiar ubicación
				</button>
			</div>
		</div>
	);
}
