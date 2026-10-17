const speedSpan = document.querySelector("#speed");
const altitudeSpan = document.querySelector("#altitude");
const tplusSpan = document.querySelector("#tplus");
const accSpan = document.querySelector("#acc");
const speedUnitSpan = document.querySelector("#speed-unit");
const accUnitSpan = document.querySelector("#acc-unit");
const startButton = document.querySelector("#start");
const changeUnitsButton = document.querySelector("#change-units");
const resetButton = document.querySelector("#reset");
const noteDiv = document.querySelector("#note");

let lat1 = null;
let lon1 = null;
let lat2 = null;
let lon2 = null;

let speedMPerS = null;
let lastMeasureT = null;
let accM = null;
let altitudeM = null;

let currUnit = 0;

let watchId = null;

function updateInfos() {
	let speedConvFactor = null;
	let accConvFactor = null;
	switch (currUnit) {
		case 0:
			speedConvFactor = 3.6;
			accConvFactor = 1.0;
			speedUnitSpan.innerText = "km/h";
			accUnitSpan.innerText = "m";
			break;
		case 1:
			speedConvFactor = 1.0;
			accConvFactor = 1.0;
			speedUnitSpan.innerText = "m/s";
			accUnitSpan.innerText = "m";
			break;
		case 2:
			speedConvFactor = 2.23694;
			accConvFactor = 3.28084;
			speedUnitSpan.innerText = "mph";
			accUnitSpan.innerText = "ft";
			break;
		case 3:
			speedConvFactor = 1.94384;
			accConvFactor = 1.0;
			speedUnitSpan.innerText = "knots";
			accUnitSpan.innerText = "m";
			break;
	}
	if (!lastMeasureT) return;
	speedSpan.innerText = Math.floor(speedConvFactor * speedMPerS);
	altitudeSpan.innerText = altitudeM === null ? "?" : Math.floor(altitudeM);
	accSpan.innerText = Math.floor(accConvFactor * accM);
	tplusSpan.innerText = Math.floor((Date.now() - lastMeasureT) / 1000);
}

function updateTplus() {
	if (!lastMeasureT) return;
	tplusSpan.innerText = Math.floor((Date.now() - lastMeasureT) / 1000);
}

const tplusUpdatorInterval = setInterval(updateTplus, 1000);

function updateSpeed(timeNow, speed) {
	if (speed !== null) {
		speedMPerS = speed;
		noteDiv.hidden = true;
		return;
	}
	const R = 6371000;
	const lat1_rad = lat1 * Math.PI / 180;
	const lat2_rad = lat2 * Math.PI / 180;
	const lon1_rad = lon1 * Math.PI / 180;
	const lon2_rad = lon2 * Math.PI / 180;
	const dlat = lat2_rad - lat1_rad;
	const dlon = lon2_rad - lon1_rad;
	const a_1 = Math.sin(dlat / 2) * Math.sin(dlat / 2);
	const a_2 = Math.cos(lat1_rad) * Math.cos(lat2_rad);
	const a_3 = Math.sin(dlon / 2) * Math.sin(dlon / 2);
	const a = a_1 + (a_2 * a_3);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	const dt = (timeNow - lastMeasureT) / 1000;
	if (dt <= 0) return;
	speedMPerS = d / dt;
	noteDiv.hidden = false;
}

changeUnitsButton.addEventListener("click", (ev) => {
	ev.preventDefault();
	currUnit = (currUnit + 1) % 4
	updateInfos();
});

startButton.addEventListener("click", (ev) => {
	ev.preventDefault();
	if (lastMeasureT) return;
	watchId = navigator.geolocation.watchPosition(
		(pos) => {
			if (lastMeasureT) {
				lat2 = pos.coords.latitude;
				lon2 = pos.coords.longitude;
				updateSpeed(Date.now(), pos.coords.speed);
			}
			console.log(pos);
			lastMeasureT = Date.now();
			lat1 = pos.coords.latitude;
			lon1 = pos.coords.longitude;
			accM = pos.coords.accuracy;
			altitudeM = pos.coords.altitude;
			updateInfos();
		},
		(err) => {
			console.error(err);
			if (err.code === 1) {
				alert(err.message);
			}
		},
		{
			maximumAge: 0,
			timeout: 3000
		}
	);
});

resetButton.addEventListener("click", (ev) => {
	ev.preventDefault();
	window.location.reload();
});