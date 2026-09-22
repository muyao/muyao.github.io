const changeForm = document.querySelector("#change");
const changeInput = document.querySelector("#password");
const changeButtonArr = document.querySelectorAll(".val-change");
const changeButtonDiv = document.querySelector("#change-buttons");
const hiddenDiv = document.querySelector("#hidden");
const fileInput = document.querySelector("#file-input");
const alertsDiv = document.querySelector("#alerts");
const streakSpan = document.querySelector("#streak");
const freezesSpan = document.querySelector("#freezes");
const gemsSpan = document.querySelector("#gems");
const confCanvas = document.querySelector("#confetti-canvas")

const confettiFX = new ConfettiEngine(confCanvas, 0.4);
function launchConfetti() {
	confettiFX.burst({
		count: 160,
		angmod1: 0.125,
		angmod2: 1.5 * Math.PI,
		velmod: 1.5,
		x: 0,
		y: confCanvas.height
	});
	confettiFX.burst({
		count: 160,
		angmod1: 0.125,
		angmod2: 1.25 * Math.PI,
		velmod: 1.5,
		x: confCanvas.width,
		y: confCanvas.height
	});
}

const showAlertDefaultDur = 2500;
const pricing = {
	streakFreeze: 15
};
const earning = {
	dailyMin: 2,
	dailyMax: 7,
	bonusMod: 5
};
let passwordHash = null;
let syncing = false;

let currentStreak;
let currentFreezes;
let currentGems;
let nextMilestoneRewards;

function resetAll() {
	currentStreak = 0;
	currentFreezes = 2;
	currentGems = 25;
	nextMilestoneRewards = {
		"0": [115, 365],
		"10": [7, 10],
		"25": [10, 25],
		"50": [15, 50],
		"100": [25, 100],
		"200": [50, 200],
	};
}
resetAll();

function setSyncStatus(status) {
	changeInput.disabled = status;
	syncing = status;
	if (status) {
		changeButtonDiv.style.color = "gray";
	} else {
		changeButtonDiv.style.color = "white";
	}
}

function showAlert(msg, col, dur = showAlertDefaultDur) {
	if (alertsDiv.childNodes.length >= 5) return;
	const alertElem = document.createElement("p");
	alertElem.innerText = msg;
	alertElem.style.color = col;
	alertsDiv.appendChild(alertElem);
	setTimeout(() => {
		alertsDiv.removeChild(alertElem);
	}, dur);
}

function updateDisplayed() {
	streakSpan.innerText = currentStreak;
	freezesSpan.innerText = currentFreezes;
	gemsSpan.innerText = currentGems;
	requestAnimationFrame(updateDisplayed);
}

async function hash(str) {
	const msgUint8 = new TextEncoder().encode(str);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

async function getKV() {
	const response = JSON.parse(
		await (
			await fetch(
				"https://lewins-streak.muyao-app.workers.dev"
			)
		).text()
	);
	currentStreak = parseInt(response.s);
	currentFreezes = parseInt(response.f);
	currentGems = parseInt(response.g);
	nextMilestoneRewards = JSON.parse(response.m);
}

async function postKV(key, value, passhash) {
	const response = JSON.parse(
		await (
			await fetch(
				"https://lewins-streak.muyao-app.workers.dev",
				{
					method: "POST",
					body: JSON.stringify({ key, value, passhash })
				}
			)
		).text()
	);
	if (!response.success) {
		if (response.message === "incorrect password") {
			showAlert("Wrong password", "red");
		} else {
			showAlert(response.message, "red");
		}
		return false;
	}
	return response;
}

changeForm.addEventListener("submit", (e) => {
	e.preventDefault();
});

changeForm.addEventListener("input", async (e) => {
	e.preventDefault();
	if (changeInput.value === "") {
		passwordHash = null;
		return;
	}
	passwordHash = await hash(changeInput.value);
});

changeButtonArr[0].addEventListener("click", async () => {
	if (syncing) return;
	setSyncStatus(true);
	let r = await postKV("streak", currentStreak + 1, passwordHash ?? true);
	if (!r) {
		setSyncStatus(false);
		return;
	}
	currentStreak = r.value;
	const dailyEarn = Math.floor(
		(earning.dailyMax - earning.dailyMin) * Math.random()
	) + earning.dailyMin;
	showAlert(
		`+${dailyEarn} gems for extending your streak today`,
		"cadetblue",
		3000
	);
	r = await postKV("gems", currentGems + dailyEarn, passwordHash ?? true);
	currentGems = r.value;
	let reward = 0;
	for (const k in nextMilestoneRewards) {
		const v = nextMilestoneRewards[k];
		if (v[1] === currentStreak) {
			reward += v[0];
			v[1] += parseInt(k);
		}
	}
	if (reward !== 0) {
		const randBonus = Math.floor(earning.bonusMod * Math.random());
		showAlert(
			`+${reward + randBonus} bonus gems for reaching a ${currentStreak} `
			+ "day streak",
			"green",
			3000
		);
		launchConfetti();
		r = await postKV("gems", currentGems + reward + randBonus, passwordHash ?? true);
		currentGems = r.value;
		r = await postKV(
			"nextms", JSON.stringify(nextMilestoneRewards), passwordHash ?? true
		);
		nextMilestoneRewards = JSON.parse(r.value);
	}
	setSyncStatus(false);
});

changeButtonArr[1].addEventListener("click", async () => {
	if (syncing) return;
	if (currentFreezes >= 5) {
		showAlert("Maximum streak freezes reached", "darkgoldenrod");
		return;
	}
	if (currentGems < pricing.streakFreeze) {
		showAlert(
			`Not enough gems! Requires ${pricing.streakFreeze}`, "darkgoldenrod"
		);
		return;
	}
	if (!confirm(
		`Buy 1 streak freeze for ${pricing.streakFreeze} gems?`
	)) return;
	setSyncStatus(true);
	let r = await postKV("freezes", currentFreezes + 1, passwordHash ?? true);
	if (!r) {
		setSyncStatus(false);
		return;
	}
	currentFreezes = r.value;
	r = await postKV(
		"gems", currentGems - pricing.streakFreeze, passwordHash ?? true
	);
	currentGems = r.value;
	showAlert("Bought +1 streak freeze", "cadetblue");
	setSyncStatus(false);
});

changeButtonArr[2].addEventListener("click", async () => {
	if (syncing) return;
	if (currentFreezes <= 0) {
		showAlert("No streak freezes left", "darkgoldenrod");
		return;
	}
	setSyncStatus(true);
	const r = await postKV("freezes", currentFreezes - 1, passwordHash ?? true);
	if (!r) {
		setSyncStatus(false);
		return;
	}
	currentFreezes = r.value;
	setSyncStatus(false);
});

changeButtonArr[3].addEventListener("click", async () => {
	if (syncing) return;
	if (!confirm("Reset streak?")) return;
	resetAll();
	setSyncStatus(true);
	if (!await postKV("streak", currentStreak, passwordHash ?? true)) {
		setTimeout(() => {
			window.location.reload();
		}, showAlertDefaultDur);
		return;
	}
	await postKV("freezes", currentFreezes, passwordHash ?? true);
	await postKV("gems", currentGems, passwordHash ?? true);
	await postKV(
		"nextms", JSON.stringify(nextMilestoneRewards), passwordHash ?? true
	);
	setSyncStatus(false);
});

(async () => {
	setSyncStatus(true);
	await getKV();
	setSyncStatus(false);
	updateDisplayed();
})();