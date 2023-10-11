"use strict";

// ELDRITCH BLAST! BWAH
htmx.defineExtension("eldritch-blast", {
	onEvent: function(name, evt) {
		if (name == "htmx:beforeProcessNode") {
			let elt = evt.detail.elt;
			let target = evt.target;
			if (!document.getElementById("eldritch-style")) {
				const eldritch_style = document.createElement("style");
				eldritch_style.id = "eldritch-style";
				eldritch_style.innerText = ".eldritch-wrap { display: flex; flex-flow: row nowrap; align-items: center; font-size: 2em; } .eldritch-wrap .warlock-hand { transition: transform 500ms; } .eldritch-wrap .warlock-hand:hover, .eldritch-wrap .warlock-hand:active { transform: rotateY(50deg); } .eldritch-wrap .eldritch-blast { z-index: 9999; height: 0; width: 100vw; margin-right: 100vw; border-radius: 5px; background-color: floralwhite; transform: skew(10deg); transition: height 500ms, margin-right 500ms, transform 500ms; animation: fadein-frames 200ms infinite; } .eldritch-wrap .eldritch-blast.blast { margin-right: 0.7em !important; height: 0.9em !important; transform: skew(0deg) !important; mix-blend-mode: screen; background-image: radial-gradient(hsl(180, 100%, 80%), hsl(180, 100%, 80%) 10%, hsla(180, 100%, 80%, 0) 56%); } @keyframes fade-frames { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; }"
				document.head.appendChild(eldritch_style);
			}
			const warlock_hand = document.createElement("span");
			warlock_hand.classList.add("warlock-hand");
			warlock_hand.innerText = String.fromCodePoint(0x270B);
			warlock_hand.addEventListener("click", function(e) {
				e.preventDefault();
				for (const element of this.parentElement.getElementsByClassName('eldritch-blast')) {
					element.classList.add('blast');
					setTimeout(function(element) {
						element.classList.remove('blast');
					}, 700, element);
				}
			});
			const eldritch_blast = document.createElement("span");
			eldritch_blast.classList.add("eldritch-blast");
			const eldritch_wrap = document.createElement("div");
			eldritch_wrap.classList.add("eldritch-wrap");
			eldritch_wrap.innerText = String.fromCodePoint(0x1F9D9, 0x1F3FB);
			eldritch_wrap.appendChild(warlock_hand);
			eldritch_wrap.appendChild(eldritch_blast);
			target.insertBefore(eldritch_wrap, target.children[0]);
		}
		return true;
	}
});
