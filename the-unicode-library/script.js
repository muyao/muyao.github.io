(async () => {
    // DOM Elements
    const searchForm = document.querySelector("#search");
    const searchInputInput = document.querySelector("#search-input");
    const resultsDiv = document.querySelector("#results");

    const unicodeData = (
        await (
            await fetch("UnicodeData.txt")
        ).text()
    ).trim().split("\n").map((val, idx) => {
        const valArr = val.split(";");
        return {
            id: idx,
            name: valArr[1],
            charCode: valArr[0],
            char: String.fromCodePoint(parseInt(valArr[0], 16))
        };
    });

    // Search Engine
    const miniSearch = new MiniSearch({
        fields: ["name"],
        storeFields: ["name", "charCode", "char"],
        searchOptions: {
            fuzzy: 0.2
        }
    });
    miniSearch.addAll(unicodeData);

    let searchTimeout = null;

    // Clear old results
    function removeResults() {
        while (resultsDiv.hasChildNodes()) {
            resultsDiv.childNodes.forEach((e) => {
                e.remove();
            });
        }
    }

    // Create single result
    function createResultElement(char, name) {
        const resultContainer = document.createElement("div");
        const result = document.createElement("div");
        result.className = "result";
        const charSpan = document.createElement("span");
        charSpan.className = "result-char";
        charSpan.innerText = char;
        const datSpan = document.createElement("span");
        datSpan.className = "result-name";
        datSpan.innerText = name;

        result.appendChild(charSpan);
        result.appendChild(datSpan);
        resultContainer.appendChild(result)

        resultContainer.addEventListener("click", async () => {
            await navigator.clipboard.writeText(char);
            result.style.border = "1px solid green";
            setTimeout(() => {
                result.style.border = "1px solid gray";
            }, 200);
        });

        resultContainer.addEventListener("mouseenter", () => {
            resultContainer.style.paddingLeft = "1rem";
        });

        resultContainer.addEventListener("mouseleave", () => {
            resultContainer.style.paddingLeft = "0";
            result.style.border = "1px solid gray";
        });

        resultContainer.addEventListener("mousedown", () => {
            result.style.border = "1px solid white";
        });

        resultContainer.addEventListener("mouseup", () => {
            result.style.border = "1px solid gray";
        });

        return resultContainer;
    }

    // Show all results
    function showResults(results) {
        removeResults();
        results.forEach((r) => {
            if (resultsDiv.childNodes.length >= 255) return;
            const elem = createResultElement(r.char, r.name);
            resultsDiv.appendChild(elem);
        })
    }

    searchInputInput.addEventListener("input", () => {
        clearTimeout(searchTimeout ?? undefined);
        searchTimeout = setTimeout(() => {
            showResults(miniSearch.search(searchInputInput.value));
        }, 500);
    });

    searchForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
    });
})();