
/*--- ADD CONTRACT NUMBER ---*/
const x = document.getElementById("newContrBtn");
x.addEventListener("click", addContr);

async function addContr() {
	const text = document.getElementById("newContrNum").value.trim();
	if (!text) {
		alert("Παρακαλώ πληκτρολογήστε έναν αριθμό σύμβασης.");
		return;
	}

	const response = await fetch("http://localhost:5000/api/contracts", {
		method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contract: text })
	});

	const data = await response.json();

	if (!response.ok) {
		alert(data.error || "Αποτυχία προσθήκης σύμβασης.");
		return;
	}

	document.getElementById("newContrNum").value = "";

	await loadContracts();

	document.getElementById("contracts").value = data.id;
}


/*--- ADD MATERIAL NAME ---*/
const materialInput = document.getElementById("materialName");
materialInput.addEventListener("blur", saveMatName);
materialInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { materialInput.blur(); } })

async function saveMatName() {
	const selectedContract = document.getElementById("contracts");
	const selectedContractId = selectedContract.value;

	const materialValue = materialInput.value.trim();

	if (!selectedContractId) {
		return;
	}

	try {
		await fetch(`http://localhost:5000/api/contracts/${selectedContractId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ material_name: materialValue }) });
		console.log("Materialname saved.")
	} catch (error) {
		console.error("Σφάλμα κατά την αποθήκευση!", error);
	}
}



/*--- ADD NSN ---*/
document.getElementById("newNsnBtn").addEventListener("click", addNsn);

async function addNsn() {
	const text = document.getElementById("newNsn").value;
	const contrSelect = document.getElementById("contracts");
	const selectedContractId = contrSelect.value;

	if (!selectedContractId) {
		alert("Παρακαλώ επιλέξτε μία Σύμβαση");
		return;
	}

	if (!text) {
		alert("Παρακαλώ πληκτρολογήστε ένα NSN.");
		return;
	}

	const list = text.split("\n");

	for (const rawElement of list) {
		element = rawElement.trim();
		if (element != "") {
			try {
				const response = await fetch(`http://localhost:5000/api/nsn/${selectedContractId}`, {
					method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ NSN: element })
				});

				const data = await response.json();

				if (!response.ok) {
					alert(data.error || "Αποτυχία προσθήκης NSN.");
					return;
				}

			} catch (error) {
				console.error("Σφάλμα κατά την αποθήκευση NSN:", element, error)
			}
		}
	}
	document.getElementById("newNsn").value = "";
	await loadNSN();
}



/*--- ADD PART NUMBER ---*/
document.getElementById("newPartBtn").addEventListener("click", addPart);

async function addPart() {
	const text = document.getElementById("newPartNum").value;

	const selectedContract = document.getElementById("contracts");
	const selectedContractId = selectedContract.value;

	const activeNSN = document.querySelector("#nsnList button.active");
	if (!activeNSN) return;
	const selectedNsnId = activeNSN.value;

	if (!selectedNsnId) {
		alert("Παρακαλώ επιλέξτε NSN.");
		return;
	}

	list = text.split("\n");

	for (const rawElement of list) {
		element = rawElement.trim();

		if (element != "") {
			try {
				const response = await fetch(`http://localhost:5000/api/parts/${selectedNsnId}/${selectedContractId}`, {
					method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ part: element })
				});

				const data = await response.json();

				if (!response.ok) {
					alert(data.error || "Αποτυχία προσθήκης Part Number.");
					return;
				}

			} catch (error) {
				console.error("Σφάλμα κατά την αποθήκευση Part Number:", element, error)
			}
		}
	}
	document.getElementById("newPartNum").value = "";
	await loadParts(selectedNsnId, selectedContractId);
}



/*--- ADD SERIAL NUMBER ---*/
document.getElementById("newSerialBtn").addEventListener("click", addSerial);

async function addSerial() {
	const text = document.getElementById("newSerNum").value;

	const selectedContract = document.getElementById("contracts");
	const selectedContractId = selectedContract.value;

	const activePart = document.querySelector("#partsList button.active");
	if (!activePart) return;
	const selectedPartId = activePart.value;

	const list = text.split("\n");

	for (const rawElement of list) {
		element = rawElement.trim();

		if (element != "") {
			try {
				response = await fetch(`http://localhost:5000/api/serials/${selectedPartId}/${selectedContractId}`, {
					method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serial: element })
				});

				const data = await response.json();

				if (!response.ok) {
					alert(data.error || "Αποτυχία προσθήκης Serial Number.");
					return;
				}
			} catch (error) {
				console.error("Σφάλμα κατά την αποθήκευση του Serial Number", element, error);
			}
		}
	}
	document.getElementById("newSerNum").value = "";
	await loadSerials(selectedPartId, selectedContractId);
}





/*--- REMOVE CONTRACT ---*/
document.getElementById("rmvContrBtn").addEventListener("click", rmvContr);

async function rmvContr() {
	const select = document.getElementById("contracts");
	const contr_id = select.value;

	if (!contr_id) {
		alert("Παρακαλώ επιλέξτε πρώτα μία σύμβαση για διαγραφή.");
		return;
	}

	if (!confirm("Είστε σίγουροι για την διαγραφή;")) { return; }

	try {
		const response = await fetch(`http://localhost:5000/api/contracts/${contr_id}`, { method: "DELETE" });
		if (response.ok) {
			await loadContracts();

			document.getElementById("nsnList").innerHTML = "";
			document.getElementById("partsList").innerHTML = "";
			document.getElementById("serialsList").innerHTML = "";
		} else {
			alert("Σφάλμα κατά την διαγραφή!");
		}
	} catch (error) {
		console.error("Σφάλμα σύνδεσης:", error);
	}
}




/*--- REMOVE NSN ---*/
async function rmvNSN(nsn_id) {
	if (!confirm("Είστε σίγουροι για την διαγραφή;")) { return; }

	try {
		const response = await fetch(`http://localhost:5000/api/nsn/${nsn_id}`, { method: "DELETE" });
		if (response.ok) {
			await loadNSN();
		} else {
			alert("Σφάλμα κατά την διαγραφή!");
		}
	} catch (error) {
		console.error("Σφάλμα σύνδεσης:", error);
	}
}



/*--- REMOVE PART NUMBER ---*/
async function rmvPart(pn_id, contract_id) {
	if (!confirm("Είστε σίγουροι για την διαγραφή;")) { return; }

	const selectedContract = document.getElementById("contracts");
	const selectedContractId = selectedContract.value;

	const activeNSN = document.querySelector("#nsnList button.active");
	if (!activeNSN) return;
	const selectedNsnId = activeNSN.value;

	try {
		const response = await fetch(`http://localhost:5000/api/parts/${pn_id}/${contract_id}`, { method: "DELETE" });
		if (response.ok) {
			await loadParts(selectedNsnId, selectedContractId);
		} else {
			alert("Σφάλμα κατά την διαγραφή!");
		}
	} catch (error) {
		console.error("Σφάλμα σύνδεσης:", error);
	}

}



/*--- REMOVE SERIAL NUMBER ---*/
async function rmvSerial(serial_id, contract_id) {
	if (!confirm("Είστε σίγουροι για την διαγραφή;")) { return; }

	const activePart = document.querySelector("#partsList button.active");
	if (!activePart) return;
	const selectedPartId = activePart.value;

	try {
		const response = await fetch(`http://localhost:5000/api/serials/${contract_id}/${serial_id}`, { method: "DELETE" });
		if (response.ok) {
			await loadSerials(selectedPartId);
		} else {
			alert("Σφάλμα κατά την διαγραφή!");
		}
	} catch (error) {
		console.error("Σφάλμα σύνδεσης:", error);
	}
}



/*--- ADD SIGNAL ---*/
document.getElementById("addSigBtn").addEventListener("click", addSignal);

function addSignal() {
	const text = document.getElementById("newSignal").value.trim();
	if (text != "") {
		const list = document.getElementById("signalsList");

		const newDiv = document.createElement("div");
		newDiv.className = "list-group-item d-flex justify-content-between align-items-center";
		newDiv.style.padding = "0.4rem 1rem";

		const newSpan = document.createElement("span");
		newSpan.textContent = text;

		const rmvBtn = document.createElement("button");
		rmvBtn.type = "button";
		rmvBtn.className = "btn-add btn-remove";
		rmvBtn.style.cssText = "width: 24px; height: 24px; font-size: 1.5rem; line-height: 0;"
		rmvBtn.textContent = "-";
		rmvBtn.addEventListener("click", function () { newDiv.remove() });

		newDiv.appendChild(newSpan);
		newDiv.appendChild(rmvBtn);
		list.appendChild(newDiv);
		document.getElementById("newSignal").value = "";
	}
}



/* ---GET CONTRACTS FROM DB--- */
/*async function loadContracts() {
	try {
		const response = await fetch("http://localhost:5000/api/contracts");
		const contractsData = await response.json();
		const select = document.getElementById("contracts");
		select.innerHTML = "<option value=''>---Choose a Contract---</option>";
		contractsData.forEach(function (row) {
			const option = document.createElement("option");
			option.value = row.id;
			option.textContent = row.contract;

			select.appendChild(option);
		})
	} catch (error) {
		console.error("Σφάλμα κατά τη σύνδεση με το API:", error);
	}
}
document.addEventListener("DOMContentLoaded", loadContracts);
*/
let allContracts = [];

async function loadContracts() {
	try {
		const response = await fetch(`http://localhost:5000/api/contracts`);
		allContracts = await response.json();
		renderContracts(allContracts);
	} catch (error) {
		console.error("Σφάλμα κατά την σύνδεση με το API:", error);
	}
}
document.addEventListener("DOMContentLoaded", loadContracts);



function renderContracts(contractsList) {
	const select = document.getElementById("contracts");
	const previousValue = select.value;

	select.innerHTML = "<option value=''>---Choose a Contract---</option>";

	contractsList.forEach(row => {
		const option = document.createElement("option");
		option.value = row.id;
		option.textContent = row.contract;
		select.appendChild(option);
	});

	if (previousValue && contractsList.some(c => c.id == previousValue)) {
		select.value = previousValue;
	} else if (contractsList.length === 1) {
		select.value = contractsList[0].id;
		select.dispatchEvent(new Event("change"));
	} else {
		select.value = "";
		select.dispatchEvent(new Event("change"));
	}
}



/*--- GET NAME FROM DB ---*/
document.getElementById("contracts").addEventListener("change", async function () {
	const selectedContractId = this.value;
	const materialInput = document.getElementById("materialName");

	if (!selectedContractId) {
		materialInput.value = "";
		return;
	}

	const response = await fetch("http://localhost:5000/api/contracts");
	const contracts = await response.json();
	const currentContract = contracts.find(c => c.id == selectedContractId);

	if (currentContract && currentContract.matName) {
		materialInput.value = currentContract.matName;
	} else {
		materialInput.value = "";
	}
});


/* ---GET NSN FROM DB---*/
async function loadNSN() {
	try {
		const contrSelect = document.getElementById("contracts");
		const selectedContractId = contrSelect.value;
		const list = document.getElementById("nsnList");
		const partsList = document.getElementById("partsList");
		const serialsList = document.getElementById("serialsList");

		if (!selectedContractId) {
			list.innerHTML = "";
			partsList.innerHTML = "";
			serialsList.innerHTML = "";
			return;
		}

		partsList.innerHTML = "";
		serialsList.innerHTML = "";
		list.innerHTML = "";

		const response = await fetch(`http://localhost:5000/api/nsn/${selectedContractId}`);
		const nsnData = await response.json();

		nsnData.forEach(function (row) {
			const nsnBtn = document.createElement("button");
			nsnBtn.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
			nsnBtn.style.padding = "0.4rem 0.5rem 0.4rem 1rem";
			nsnBtn.value = row.id;

			const nsnLabel = document.createElement("span");
			nsnLabel.textContent = row.NSN;

			const rmvBtn = document.createElement("button");
			rmvBtn.type = "button";
			rmvBtn.className = "btn-add btn-remove flex-shrink-0 me-4";
			rmvBtn.style.cssText = "width: 36px; height: 24px; font-size: 1.5rem; line-height: 0;";
			rmvBtn.textContent = "--";
			rmvBtn.addEventListener("click", async function (event) { event.stopPropagation(); await rmvNSN(row.id); });

			nsnBtn.addEventListener("click", function () {
				document.querySelectorAll("#nsnList button").forEach(b => b.classList.remove("active"));
				nsnBtn.classList.add("active");
				loadParts(row.id, selectedContractId);
			});

			nsnBtn.appendChild(nsnLabel);
			nsnBtn.appendChild(rmvBtn);
			list.appendChild(nsnBtn);
		});
	} catch (error) {
		console.error("Σφάλμα κατά τη σύνδεση με το API:", error);
	}
}
document.getElementById("contracts").addEventListener("change", loadNSN);



/* ---GET PART NUMBER FROM DB---*/
async function loadParts(nsn_id, contract_id) {
	try {
		const response = await fetch(`http://localhost:5000/api/parts/${nsn_id}/${contract_id}`);
		const partData = await response.json();
		const list = document.getElementById("partsList");
		const serialsList = document.getElementById("serialsList");
		serialsList.innerHTML = "";
		list.innerHTML = "";

		partData.forEach(function (row) {
			const partBtn = document.createElement("button");
			partBtn.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
			partBtn.style.padding = "0.4rem 0.5rem 0.4rem 1rem";
			partBtn.value = row.pn_id;

			const partLabel = document.createElement("span");
			partLabel.textContent = row.partNumber;

			const rmvBtn = document.createElement("button");
			rmvBtn.type = "button";
			rmvBtn.className = "btn-add btn-remove flex-shrink-0 me-4";
			rmvBtn.style.cssText = "width: 36px; height: 24px; font-size: 1.5rem; line-height: 0;";
			rmvBtn.textContent = "--";
			rmvBtn.addEventListener("click", async function (event) { event.stopPropagation(); await rmvPart(row.pn_id, contract_id) });

			partBtn.addEventListener("click", function () {
				document.querySelectorAll("#partsList button").forEach(b => b.classList.remove("active"));
				partBtn.classList.add("active");
				loadSerials(row.pn_id);
			});

			partBtn.appendChild(partLabel);
			partBtn.appendChild(rmvBtn);
			list.appendChild(partBtn);
		});

	} catch (error) {
		console.error("Σφάλμα κατά τη σύνδεση με το API:", error);
	}
}



/*--- LOAD SERIAL NUMBERS FROM DB ---*/
async function loadSerials(part_id) {
	try {

		const list = document.getElementById("serialsList");
		list.innerHTML = "";
		const contrSelect = document.getElementById("contracts");
		const contract_id = contrSelect.value;
		const response = await fetch(`http://localhost:5000/api/serials/${part_id}/${contract_id}`);
		const serialData = await response.json();

		serialData.forEach(function (row) {
			const serialBtn = document.createElement("button");
			serialBtn.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
			serialBtn.style.padding = "0.4rem 0.5rem 0.4rem 1rem";
			serialBtn.id = "serialBtn";
			serialBtn.setAttribute("data-bs-toggle", "offcanvas");
			serialBtn.setAttribute("data-bs-target", "#snDetailsPanel");

			const serialLabel = document.createElement("span");
			serialLabel.textContent = row.serialNumber;

			const rmvBtn = document.createElement("button");
			rmvBtn.type = "button";
			rmvBtn.className = "btn-add btn-remove flex-shrink-0 me-4";
			rmvBtn.style.cssText = "width: 36px; height: 24px; font-size: 1.5rem; line-height: 0;";
			rmvBtn.textContent = "--";
			rmvBtn.addEventListener("click", async function (event) { event.stopPropagation(); await rmvSerial(row.id, contract_id); });

			serialBtn.addEventListener("click", function () {
				const snInput = document.getElementById("selectedInput");
				if (snInput) {
					snInput.value = row.serialNumber;
				}
				document.getElementById("dateIn").value = row.dateArrived;
				document.getElementById("dateOut").value = row.dateFinished;
				document.getElementById("workHours").value = row.workHours;
				document.getElementById("invoicedCheck").value = row.finished;
			});

			serialBtn.appendChild(serialLabel);
			serialBtn.appendChild(rmvBtn);
			list.appendChild(serialBtn);
		});

	} catch (error) {
		console.error("Σφάλμα κατά τη σύνδεση με το API:", error);
	}
}



/*--- SEARCH BAR ---*/

const filterInputs = ["bruce", "robin", "nightwing", "redhood"];
let filterDebounce = null;

filterInputs.forEach(id => {
	const el = document.getElementById(id);
	if (el) {
		el.addEventListener("input", () => {
			clearTimeout(filterDebounce);
			filterDebounce = setTimeout(batman, 300);
		});
	}
});



async function batman() {
	const contract = document.getElementById("bruce").value.trim();
	const nsn = document.getElementById("robin").value.trim();
	const part = document.getElementById("nightwing").value.trim();
	const serial = document.getElementById("redhood").value.trim();

	if (!contract && !nsn && !serial && !part) {
		renderContracts(allContracts);
		return;
	}

	const query = new URLSearchParams({
		contract: contract,
		nsn: nsn,
		part: part,
		serial: serial
	});

	try {
		const response = await fetch(`http://localhost:5000/api/search?${query.toString()}`);
		const data = await response.json();

		console.log("Βρρέθηκαν τα αποτελέσματα: ", data);

		const matchingData = new Set(data.map(row => Number(row.contract_id)));

		const filteredContracts = allContracts.filter(c => matchingData.has(Number(c.id)));

		renderContracts(filteredContracts);

	} catch (error) {
		console.error("Σφάλμα κατά το φιλτράρισμα του dropdown:", error);
	}
}



setInterval(() => {
	fetch("http://localhost:5000/api/heartbeat", { method: "POST" })
		.catch(() => {
		});
}, 2000);
