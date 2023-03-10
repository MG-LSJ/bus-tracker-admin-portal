mapboxgl.accessToken =
	"pk.eyJ1IjoibGFrc2h5YWplZXQiLCJhIjoiY2tuMWM2amttMHN0NDJ3cXVxOGJsY3p4MiJ9.LuGi_8FfhyDQHtWqHRgcjw";

const pubnub = new PubNub({
	subscribeKey: "sub-c-10e0e350-30c8-4f8c-84dc-659f6954424e",
	uuid: "adminWebClient",
});

const map = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/lakshyajeet/clc3bmrhi005y14s1vk7tqr45",
	center: [79.51, 29.1869],
	zoom: 12,
	hash: true,
	maxPitch: 45,
	doubleClickZoom: false,
});

const busList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const bussesObject = {
	A: { routeColor: "#05cb63" },
	B: { routeColor: "#00bcff" },
	C: { routeColor: "#ff69b4" },
	D: { routeColor: "#ff00bc" },
	E: { routeColor: "#bcff00" },
	F: { routeColor: "#003dff" },
	G: { routeColor: "#ff4300" },
	H: { routeColor: "#ffc300" },
	I: { routeColor: "#FF003C" },
	J: { routeColor: "#ba6281" },
};

busList.forEach((bus) => {
	for (let i = 1; i <= 4; i++)
		fetch(`data/${bus + i}.geojson`)
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				bussesObject[bus][`route${i}`] = data;
			})
			.catch((error) => {
				bussesObject[bus][`route${i}`] = null;
			});
});

const busInputs = document.getElementById("bus").getElementsByTagName("input");
const shiftInputs = document
	.getElementById("shift")
	.getElementsByTagName("input");
var busNo, shiftNo;
for (const input of busInputs) {
	input.onclick = (bus) => {
		if (busNo !== bus.target.value) {
			busNo = bus.target.value;
			highlightBus();
		} else {
			document.getElementById(
				`bus-${busNo.toLowerCase()}`
			).checked = false;
			busNo = undefined;
			unhighlightBus();
		}
	};
	if (input.checked) {
		if (busNo !== input.value) {
			busNo = input.value;
			highlightBus();
		}
	}
}
for (const input of shiftInputs) {
	input.onclick = (shift) => {
		if (shiftNo !== shift.target.value) {
			shiftNo = shift.target.value;
			changeBusRoute();
		} else {
			fitRouteOnMap(bussesObject[busNo][`route${shiftNo}`]);
		}
	};
	if (input.checked) {
		shiftNo = input.value;
	}
}

map.on("load", () => {
	changeBusRoute();
	map.loadImage("media/logo.png", (error, image) => {
		if (error) throw error;
		map.addImage("cat", image);
		map.addSource("GEHU-icon-source", {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [79.51564595103264, 29.12450375392585],
						},
					},
				],
			},
		});
		map.addLayer({
			id: "GEHU-icon-layer",
			type: "symbol",
			source: "GEHU-icon-source",
			layout: {
				"icon-image": "cat",
				"icon-size": [
					"interpolate",
					["linear"],
					["zoom"],
					0,
					0.01,
					12,
					0.05,
					22,
					0.2,
				],
			},
		});
		map.on("dblclick", "GEHU-icon-layer", (e) => {
			map.flyTo({
				center: e.features[0].geometry.coordinates,
				zoom: 15,
			});
		});

		// Change the cursor to a pointer when the it enters a feature in the 'circle' layer.
		map.on("mouseenter", "GEHU-icon-layer", () => {
			map.getCanvas().style.cursor = "pointer";
		});

		// Change it back to a pointer when it leaves.
		map.on("mouseleave", "GEHU-icon-layer", () => {
			map.getCanvas().style.cursor = "";
		});
	});
});

function fitRouteOnMap(geojson) {
	const coordinates = geojson.features[0].geometry.coordinates;
	// Create a 'LngLatBounds' with both corners at the first coordinate.
	routeBounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
	// Extend the 'LngLatBounds' to include every coordinate in the bounds result.
	for (const coord of coordinates) {
		routeBounds.extend(coord);
	}
	map.fitBounds(routeBounds, {
		padding: 50,
	});
}

function changeBusRoute() {
	busList.forEach((bus) => {
		if (map.getLayer(bus)) {
			map.removeLayer(bus);
		}
		if (map.getSource(bus)) {
			map.removeSource(bus);
		}
		let routeGeoJson = bussesObject[bus][`route${shiftNo}`];
		if (routeGeoJson) {
			map.addSource(bus, {
				type: "geojson",
				data: routeGeoJson,
			});
			map.addLayer(
				{
					id: bus,
					type: "line",
					source: bus,
					layout: {
						"line-join": "round",
						"line-cap": "round",
					},
					paint: {
						"line-color": bussesObject[bus].routeColor,
						"line-width": 8,
						"line-opacity": 0.5,
					},
				},
				"road-label-navigation"
			);
			if (bus === busNo) {
				fitRouteOnMap(routeGeoJson);
			}
		}
	});
	highlightBus();
}

function highlightBus() {
	if (map.getLayer(busNo)) {
		map.moveLayer(busNo, "road-label-navigation");
		busList.forEach((bus) => {
			if (bus !== busNo && map.getLayer(bus)) {
				map.setPaintProperty(bus, "line-opacity", 0.5);
			}
		});
		map.setPaintProperty(busNo, "line-opacity", 1);
		let routeGeoJson = bussesObject[busNo][`route${shiftNo}`];
		fitRouteOnMap(routeGeoJson);
	}
}

function unhighlightBus() {
	busList.forEach((bus) => {
		if (map.getLayer(bus)) {
			map.setPaintProperty(bus, "line-opacity", 0.5);
		}
	});
}
