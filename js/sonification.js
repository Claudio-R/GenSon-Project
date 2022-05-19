export class Sonification {

    constructor(browser, config) {
        this.browser = browser

        this.epigenomes_url = config.epigenomes
        this.available_sonifications_url = config.available_sonifications

        this.chr = this.browser.referenceFrameList[0]['chr']
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.getSignals(this.epigenomes_url, this.chr).then(() => {
            this.loadTracks()
            this.getAvailableSonifications(this.available_sonifications_url).then(() => {
                this.createView(this.audioCtx)
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
            column.classList.add("signal-box");
            leftContainer.appendChild(column);

            var label = document.createElement("div");
            label.classList.add("signal-label");
            label.innerHTML = this.signals[i]["name"];
            column.appendChild(label);

            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("signal-checkbox");
            checkbox.id = this.signals[i]["name"];
            column.appendChild(checkbox);
        }

        rightContainer.classList.add("sonification-bottom-container");
        for(var j = 0; j < this.available_sonifications.length; j++) {
            
            var name = this.available_sonifications[j]["name"];
            
            var sonification_column = document.createElement("div")
            sonification_column.classList.add("sonification-column")
            sonification_column.setAttribute("id", `${name}-column`)
            rightContainer.appendChild(sonification_column);

            var btn = document.createElement("button")
            btn.classList.add("sonification-button");
            btn.setAttribute("id", `${name}-btn`);
            btn.innerHTML = name;
            btn.onclick = (e) => {
                var checkboxes = document.getElementsByClassName("signal-checkbox");
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
            sonification_column.appendChild(btn)


            var sonification_controller = document.createElement("div")
            sonification_controller.classList.add("sonification-controller")
            sonification_controller.setAttribute("id", `${name}-controller`)
            this.createController(sonification_controller, name)
            sonification_column.appendChild(sonification_controller)
            
        }
    }

    sliderFactory(parentDiv, parent_name, slider_name, min, max, step, value) {
        
        var slider_container = document.createElement("div");
        slider_container.classList.add("slider-container");
        parentDiv.appendChild(slider_container);

        var slider_label = document.createElement("label")
        slider_label.classList.add("slider-label");
        slider_label.setAttribute("id", `${parent_name}-${slider_name}-label`)
        slider_label.innerHTML = `${slider_name}: ${value}`;
        slider_container.appendChild(slider_label)
    
        var slider = document.createElement("input");
        slider.type = "range";
        slider.classList.add("sonification-slider");
        slider.setAttribute("id", `${parent_name}-${slider_name}-slider`);
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;

        slider.oninput = (e) => {
            slider_label.innerHTML = `${slider_name}: ${e.target.value}`;
        }

        slider_container.appendChild(slider);
    }

    createController(sonification_controller, name) {
        
        // RAW DATA SONIFICATION CONTROLLER
        if(name === "Raw Data Sonification") {
            var parent_name = "raw-data-sonification";
            this.sliderFactory(sonification_controller, parent_name, "Volume", 0, 10, 0.5, 5);
            this.sliderFactory(sonification_controller, parent_name, "Frequency", 50, 500, 1, 250)
            this.sliderFactory(sonification_controller, parent_name, "Duration", 1, 30, 1, 15)
        }
    }
    
    rawDataSonification(time) {
        const oscillator = this.audioCtx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        oscillator.connect(this.audioCtx.destination);
        oscillator.start(time);
        oscillator.stop(time + 1);

        let attackTime = 0.2;
        const attackControl = document.querySelector('#attack');
        attackControl.addEventListener('input', function() {
            attackTime = Number(this.value);
        }, false);

        let releaseTime = 0.5;
        const releaseControl = document.querySelector('#release');
        releaseControl.addEventListener('input', function() {
            releaseTime = Number(this.value);
        }, false);
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

    launchTimeCursor(id, duration) {

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

    playSonification(sonification) {

        var name = sonification["name"]
        var signals = sonification["signals"]
        var start = sonification["locus"][0]
        var end = sonification["locus"][1]
        var duration = sonification["duration"]
        var id = sonification["id"]
        
        var num_samples = Math.floor(end - start)
        
        this.launchTimeCursor()

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    updateView() {
        if(this.signals) {
            console.log(this.chr, this.signals.length)
        }
    }

}
