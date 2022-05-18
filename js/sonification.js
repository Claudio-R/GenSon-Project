// const epigenome = require('../data/Binary/epigenome.json')
// const available_sonifications = require('../data/Binary/available_sonifications.json')

export class Sonification {

    constructor(browser, config) {
        this.browser = browser

        this.epigenomes_url = config.epigenomes
        this.available_sonifications_url = config.available_sonifications

        this.chr = this.browser.referenceFrameList[0]['chr']
        
        this.getSignals(this.epigenomes_url, this.chr).then(() => {
            this.loadTracks()
            this.getAvailableSonifications(this.available_sonifications_url).then(() => {
                this.createView()
            })
        })

        this.sonificationID = 0;
    }

    /** Collect binary epigenomic data from epigenome.json */
    async getSignals(signals) {
        if (undefined === signals) {
            return undefined
        }
        if (Array.isArray(signals)) {
            return signals
        } else {
            let response = undefined
            let data = undefined
            try {
                response = await fetch(signals)
                data = await response.json()
                for (let obj of data) {
                    if (obj['chr'] === this.chr) {
                        this.signals = obj["histones"]
                        break
                    } else {
                        this.signals = undefined
                    }
                }
                console.log(this.signals)
            } catch (e) {
                console.log("Error in loading epigenomes")
            }
        }
    }

    /** Load tracks with respect to the selected chromosome */
    loadTracks() {
        var colors = ["#ee3333", "#33ee33", "#3333ee", "#eeee33", "#33eeee", "#ee33ee"];
        for(var i = 0; i < this.signals.length; i++) {
            var signal = this.signals[i]
            this.browser.loadTrack({
                url: signal["url_track"],
                name: signal["name"],
                autoHeight: true,
                color: colors[i],
                displayMode: "COLLAPSED"
            })
        }
    }

    /** Query what sonifications are available for each chromosome from available_sonifications.json*/
    async getAvailableSonifications(sonifications) {
        if (undefined === sonifications) {
            return undefined
        }
        if (Array.isArray(sonifications)) {
            return sonifications
        } else {
            let response = undefined
            let data = undefined
            try {
                response = await fetch(sonifications)
                data = await response.json()
                for (let obj of data) {
                    if (obj['chr'] === this.chr) {
                        this.available_sonifications = obj["sonifications"]
                        break
                    } else {
                        this.available_sonifications = undefined
                    }
                }
                console.log(this.available_sonifications)
            } catch (e) {
                console.log("Error in loading available sonifications")
            }
        }
    }

    createView() {

        this.$sonification_container = document.createElement("div");
        this.$sonification_container.classList.add("sonification-container");

        this.$igv_div = document.getElementById("igv-main");
        this.$igv_div.appendChild(this.$sonification_container);
        this.$igv_div.addEventListener('change', (e) => { 
            if(e.target.getAttribute("name") === "chromosome-select-widget") {
                this.chromosomeChanged() 
            }
        });

        let leftContainer = document.createElement("div");
        let rightContainer = document.createElement("div");
        this.$sonification_container.appendChild(leftContainer);
        this.$sonification_container.appendChild(rightContainer);

        leftContainer.classList.add("sonification-top-container");
        for(var i = 0; i < this.signals.length; i++) {
            var column = document.createElement("div");
            column.classList.add("sonification-column");
            leftContainer.appendChild(column);

            var label = document.createElement("div");
            label.classList.add("sonification-label");
            label.innerHTML = this.signals[i]["name"];
            column.appendChild(label);

            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("sonification-checkbox");
            checkbox.id = this.signals[i]["name"];
            column.appendChild(checkbox);
        }

        rightContainer.classList.add("sonification-bottom-container");
        for(var j = 0; j < this.available_sonifications.length; j++) {
            var btn = document.createElement("button");
            var name = this.available_sonifications[j]["name"];
            btn.classList.add("sonification-button");
            btn.setAttribute("id", `${name}-btn`);
            btn.innerHTML = name;
            btn.onclick = (e) => {
                var checkboxes = document.getElementsByClassName("sonification-checkbox");
                var selected_signals = [];
                for(var i = 0; i < checkboxes.length; i++) {
                    if(checkboxes[i].checked) {
                        selected_signals.push(checkboxes[i].id);
                    }
                }
                var selected_btn = e.target
                var selected_sonification = {
                    "type": selected_btn.innerHTML,
                    "signals": selected_signals,
                    "locus": [this.browser.referenceFrameList[0]['start'], this.browser.referenceFrameList[0]['end']],
                    "duration": 15,
                    "id": this.sonificationID
                }
                console.log(selected_sonification)
                this.sonificationID++;
                this.playSonification(selected_sonification)
            };
            rightContainer.appendChild(btn);
        }
    }

    chromosomeChanged() {
        let delay = 250;
        new Promise(resolve => setTimeout(resolve, delay)).then(() => {
            this.chr = this.browser.referenceFrameList[0]['chr']
            this.getSignals(this.epigenomes_url, this.chr).then(() => {
                this.getAvailableSonifications(this.available_sonifications_url).then(() => {
                    this.updateView()
                })
            })
        })
    }

    playSonification(sonification) {

        var name = sonification["name"]
        var signals = sonification["signals"]
        var start = sonification["locus"][0]
        var end = sonification["locus"][1]
        var duration = sonification["duration"]
        var id = sonification["id"]
        
        var num_samples = Math.floor(end - start)
        var cursor_samples = 1000
        var cursor_frequency = cursor_samples/duration

        var igv_column = document.querySelector(".igv-column")
        var timeCursor = document.createElement("div")
        timeCursor.classList.add("time-cursor")
        timeCursor.setAttribute("id", `time-cursor-${id}`)

        igv_column.appendChild(timeCursor)

        const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        async function moveCursor(cursor) {
            for (var i = 0; i < cursor_samples; i++) {
                var perc = i/cursor_samples * 100
                cursor.style.left = `${perc}%`
                await waitFor(1000/cursor_frequency);
            }
        }

        timeCursor.style.left = "0%"
        moveCursor(timeCursor).then(() => {
            console.log("Sonification finished")
            timeCursor.remove()
        })
    }

    updateView() {
        if(this.signals) {
            console.log(this.chr, this.signals.length)
        }
    }

    // callPython(btn) {
    //     console.log(btn.innerHTML)
    //     $.ajax({
    //     // POST è una CORS, per cui non è necessario specificare l'header Access-Control-Allow-Origin
    //     type: "POST",
    //     url: "../../python/test.py/test",
    //     context: document.body,
    //     }).done(() => {
    //     console.log("Success");
    //     });
    // }
}
