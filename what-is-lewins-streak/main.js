async function hash(str) {
	const msgUint8 = new TextEncoder().encode(str);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

const changeForm = document.querySelector("#change");
const changeInput = document.querySelector("#password");
const changeButtonArr = document.querySelectorAll(".val-change");
const importButton = document.querySelector("#import");
const exportButton = document.querySelector("#export");
const hiddenDiv = document.querySelector("#hidden");
const fileInput = document.querySelector("#file-input");
const alertsDiv = document.querySelector("#alerts");
const streakSpan = document.querySelector("#streak");
const freezesSpan = document.querySelector("#freezes");
const gemsSpan = document.querySelector("#gems");
const confCanvas = document.querySelector("#confetti-canvas")

const confettiFX = new ConfettiEngine(confCanvas, 0.7);

function launchConfetti() {
	confettiFX.burst({
		count: 100,
		angmod1: 0.125,
		angmod2: 1.5 * Math.PI,
		velmod: 1.5,
		x: 0,
		y: confCanvas.height
	});
	confettiFX.burst({
		count: 100,
		angmod1: 0.125,
		angmod2: 1.25 * Math.PI,
		velmod: 1.5,
		x: confCanvas.width,
		y: confCanvas.height
	});
}

function showAlert(msg, col, dur = 2500) {
	if (alertsDiv.childNodes.length >= 5) return;
	const alertElem = document.createElement("p");
	alertElem.innerText = msg;
	alertElem.style.color = col;
	alertsDiv.appendChild(alertElem);
	setTimeout(() => {
		alertsDiv.removeChild(alertElem);
	}, dur);
}

async function checkChecksum(data) {
	const checksum = data.c;
	const checksum2 = await hash(JSON.stringify({
		s: data.s,
		f: data.f,
		g: data.g,
		h: data.h,
		m: data.m
	}));
	if (checksum !== checksum2) {
		return false;
	}
	return true;
}

const milestoneRewards = {
	// increment: [reward, nextMilestone]
	5: [5, 5],
	10: [5, 10],
	25: [10, 25],
	50: [15, 50],
	100: [25, 100],
	200: [50, 200],
	365: [115, 365]
};
const pricing = {
	streakFreeze: 75
}
let passwordHash = null;
let passwordHashCheck = null;
let currentStreak = 0;
let currentFreezes = 2;
let currentGems = 100;
let nextMilestoneRewards = structuredClone(milestoneRewards);

const serialiseData = async (passHash = passwordHash) =>
	JSON.stringify({
		s: currentStreak,
		f: currentFreezes,
		g: currentGems,
		h: passHash,
		m: nextMilestoneRewards,
		c: await hash(JSON.stringify({
			s: currentStreak,
			f: currentFreezes,
			g: currentGems,
			h: passHash,
			m: nextMilestoneRewards
		}))
	});

async function autosave() {
	if (passwordHash !== passwordHashCheck && passwordHashCheck !== null) {
		return;
	}
	const content = await serialiseData();
	localStorage.setItem("autosave_data", content);
	localStorage.setItem("autosave_time", Date.now());
}

changeForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	if (!changeInput.value) return;
	passwordHash = await hash(changeInput.value);
	changeInput.value = "";
	showAlert("Password updated", "green");
	autosave();
});

exportButton.addEventListener("click", async () => {
	if (passwordHash === null && passwordHashCheck === null) {
		showAlert("Please add a password", "red");
		return;
	}
	const content = await serialiseData((
		passwordHash === passwordHashCheck || passwordHashCheck === null
	) ? passwordHash : passwordHashCheck
	);
	const blob = new Blob([content], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	const fname = `lewins-streak@${Date.now()}.streak`;
	link.download = fname;
	hiddenDiv.appendChild(link);
	link.click();
	hiddenDiv.removeChild(link);
	URL.revokeObjectURL(url);
	showAlert(`Downloaded file as "${fname}"`, "cadetblue");
});

importButton.addEventListener("click", () => {
	fileInput.click();
});

async function handleInputFile(ev) {
	try {
		data = JSON.parse(ev.target.result);
	} catch {
		showAlert("Wrong password", "red");
		return;
	}
	if (!await checkChecksum(data)) {
		showAlert("Corrupted data", "red");
		return;
	}
	currentStreak = data.s;
	currentFreezes = data.f;
	currentGems = data.g;
	passwordHashCheck = data.h;
	nextMilestoneRewards = data.m;
	showAlert("Successfully imported streak data", "green");
	autosave();
}

fileInput.addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = handleInputFile;
	reader.readAsText(file);
	fileInput.value = "";
});

changeButtonArr[0].addEventListener("click", () => {
	if (passwordHash !== passwordHashCheck && passwordHashCheck) {
		showAlert("Wrong password", "red");
		return;
	}
	currentStreak++;
	let reward = 0;
	for (const k in nextMilestoneRewards) {
		const v = nextMilestoneRewards[k];
		if (v[1] === currentStreak) {
			reward += v[0];
			v[1] += parseInt(k);
		}
	}
	currentGems += reward;
	if (reward !== 0) {
		showAlert(
			`You got ${reward} gems for reaching a ${currentStreak} day streak!`,
			"green",
			3000
		);
		launchConfetti();
	}
	autosave();
});

changeButtonArr[1].addEventListener("click", () => {
	if (passwordHash !== passwordHashCheck && passwordHashCheck) {
		showAlert("Wrong password", "red");
		return;
	}
	if (currentFreezes >= 5) {
		showAlert("Maximum streak freezes reached", "darkgoldenrod");
		return;
	}
	if (currentGems < pricing.streakFreeze) {
		showAlert(`Not enough gems! Requires ${pricing.streakFreeze}`, "darkgoldenrod");
		return;
	}
	if (!confirm(`Buy 1 streak freeze for ${pricing.streakFreeze} gems?`)) return;
	currentFreezes++;
	currentGems -= pricing.streakFreeze;
	showAlert("Bought +1 streak freeze", "cadetblue");
	autosave();
});

changeButtonArr[2].addEventListener("click", () => {
	if (passwordHash !== passwordHashCheck && passwordHashCheck) {
		showAlert("Wrong password", "red");
		return;
	}
	if (currentFreezes <= 0) {
		showAlert("No streak freezes left", "darkgoldenrod");
		return;
	}
	currentFreezes--;
	autosave();
});

changeButtonArr[3].addEventListener("click", () => {
	if (passwordHash !== passwordHashCheck && passwordHashCheck) {
		showAlert("Wrong password", "red");
		return;
	}
	if (confirm("Reset streak and password?")) {
		currentStreak = 0;
		currentFreezes = 2;
		currentGems = 100;
		passwordHash = null;
		passwordHashCheck = null;
		nextMilestoneRewards = structuredClone(milestoneRewards);
		localStorage.removeItem("autosave_data");
		localStorage.removeItem("autosave_time");
	}
});

(async () => {
	const savedData = localStorage.getItem("autosave_data");
	if (savedData !== null) {
		const data = JSON.parse(savedData);
		if (!await checkChecksum(data)) {
			localStorage.removeItem("autosave_data");
			localStorage.removeItem("autosave_time");
			return;
		}
		currentStreak = data.s;
		currentFreezes = data.f;
		currentGems = data.g;
		passwordHashCheck = data.h;
		nextMilestoneRewards = data.m;
		const savedTime = localStorage.getItem("autosave_time") ?? "[unknown]";
		showAlert(`Loaded autosave@${savedTime}`, "cadetblue");
		if (passwordHashCheck === null) showAlert(
			"Note: You have not set a password yet",
			"cadetblue",
			5000
		);
	}
})();

function updateDisplayed() {
	streakSpan.innerText = currentStreak;
	freezesSpan.innerText = currentFreezes;
	gemsSpan.innerText = currentGems;
	requestAnimationFrame(updateDisplayed);
}
updateDisplayed();