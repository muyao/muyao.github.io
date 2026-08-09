let isInverted = false;
let cps = 0;
let clicks = 0;

function handleClick() {
	if (isInverted) {
		document.documentElement.style.removeProperty("filter")
	} else {
		document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";
	}
	isInverted = !isInverted;
	clicks += 1;
}
document.addEventListener("click", (e) => {
	e.preventDefault();
	handleClick();
});
document.addEventListener("keydown", (e) => {
	e.preventDefault();
	handleClick();
});
clearInterval(window.perSecondInterval);
window.perSecondInterval = setInterval(() => {
	cps = clicks;
	clicks = 0;
	document.getElementById("display").innerHTML = cps;
}, 1000);