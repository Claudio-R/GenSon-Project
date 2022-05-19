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
            
        for(let sonification of this.available_sonifications) {

            var type = sonification["type"]
            var name = sonification["formatted_name"];

            var sonification_column = document.createElement("div")
            sonification_column.classList.add("sonification-column")
            sonification_column.setAttribute("id", `${name}-column`)
            rightContainer.appendChild(sonification_column);

            var btn = document.createElement("button")
            btn.classList.add("sonification-button");
            btn.setAttribute("id", `${name}-btn`);
            btn.innerHTML = type;
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
                    "formatted_name": selected_btn.id.slice(0, -4),
                    "signals": selected_signals,
                    "locus": [this.browser.referenceFrameList[0]['start'], this.browser.referenceFrameList[0]['end']],
                    "id": this.sonificationID,
                    "params": sonification["init_params"],
                }
                //console.log(selected_sonification)
                this.sonificationID++;
                this.playSonification(selected_sonification)
            };
            sonification_column.appendChild(btn)

            var sonification_controller = document.createElement("div")
            sonification_controller.classList.add("sonification-controller")
            sonification_controller.setAttribute("id", `${name}-controller`)
            this.createController(sonification_controller, name, sonification["init_params"])
            sonification_column.appendChild(sonification_controller)
            
        }
    }

    createController(sonification_controller, sonification_name, params) {     
        for(let param of params) {
            this.sliderFactory(sonification_controller, sonification_name, param);
        }
    }

    sliderFactory(parentDiv, parent_name, config) {

        var slider_name = config["name"]
        var min = config["min"]
        var max = config["max"]
        var step = config["step"]
        var value = config["value"]

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

    playSonification(sonification) {

        // REQUIRED SONIFICATION
        var type = sonification["type"]
        var name = sonification["formatted_name"];
        var signals = sonification["signals"]
        var start = sonification["locus"][0] / 1000;
        var end = sonification["locus"][1] / 1000;
        var id = sonification["id"]
        var params = sonification["params"]

        if(signals.length === 0) {
            console.log("No signals to play")
            return
        }
        
        // RETRIEVE CONTROL PARAMETERS

        var params_dict = {}
        for (let param of params) {
            var slider_name = param["name"]
            var slider = document.getElementById(`${name}-${slider_name}-slider`)
            var value = Number(slider.value)
            params_dict[slider_name] = value        
        }

        //console.log(params_dict)

        // RETRIEVE AND TRIM THE SIGNALS TO SONIFY
        var signal_data = []
        for(let signal of signals) {
            for(var i = 0; i < this.signals.length; i++) {
                if(this.signals[i]["name"] === signal) {
                    console.log(this.signals[i]["binary_data"])
                    var trimmed_signal = this.signals[i]["binary_data"].slice(Math.floor(start), Math.floor(end))
                    console.log(start, end)
                    signal_data.push(trimmed_signal)
                }
            }
        }

        var duration = 15;
        this.launchTimeCursor(id, duration)
        //console.log(signal_data)
        this.playRawData(signal_data, params_dict, id, duration)
    }

    playRawData(signals, params_dict, id, duration) {

        // RESUME THE AUDIO CONTEXT
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // CREATE BUFFERS
        var num_channels = signals.length;
        var buffer_length = signals[0].length;
        
        // var buffer_sampleRate = Math.max(8000, buffer_length/params_dict["Duration"]);

        var buffer_sampleRate = Math.max(8000, buffer_length/duration);

        
        var buffer = this.audioCtx.createBuffer(num_channels, buffer_length, buffer_sampleRate);
        for(var i = 0; i < num_channels; i++) {
            var channel = buffer.getChannelData(i);
            for(var j = 0; j < buffer_length; j++) {
                channel[j] = signals[i][j]
            }
        }
        
        console.log(buffer_sampleRate, buffer_length, num_channels, buffer.duration)
        
        // CREATE AN AUDIO NODE

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(params_dict["Volume"], this.audioCtx.currentTime);
        gainNode.connect(this.audioCtx.destination);

        // !! AUDIO SOURCE NODE APPLIES PANNING AUTOMATICALLY !!
        var sourceNode = this.audioCtx.createBufferSource();
        sourceNode.buffer = buffer;
        sourceNode.connect(gainNode);

        sourceNode.start();
        sourceNode.onended = () => {
            sourceNode.stop();
        }

        // CREATE GRAIN

        // const oscillator = this.audioCtx.createOscillator();
        // oscillator.type = 'sine';
        // oscillator.frequency.setValueAtTime(params_dict["Pitch"], this.audioCtx.currentTime);
        
        // const gainNode = this.audioCtx.createGain();
        // gainNode.gain.setValueAtTime(params_dict["Volume"], this.audioCtx.currentTime);

        // const envNode = this.audioCtx.createGain();
        // envNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        // envNode.gain.exponentialRampToValueAtTime(1.0, this.audioCtx.currentTime + params_dict["Attack"]);
        // envNode.gain.exponentialRampToValueAtTime(0.9, this.audioCtx.currentTime + params_dict["Attack"] + params_dict["Sustain"]);
        // envNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + params_dict["Attack"] + params_dict["Sustain"] + params_dict["Release"]);
        
        // oscillator.connect(envNode);
        // envNode.connect(gainNode);
        // gainNode.connect(this.audioCtx.destination);

        // oscillator.start(this.audioCtx.currentTime);
        // oscillator.stop(this.audioCtx.currentTime + params_dict["Attack"] + params_dict["Sustain"] + params_dict["Release"]);
        
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
        var cursor_sampleRate = cursor_samples/duration
        var cursor_samplingPeriod = 1/cursor_sampleRate
        console.log(cursor_sampleRate, cursor_samplingPeriod)

        var igv_column = document.querySelector(".igv-column")
        var timeCursor = document.createElement("div")
        timeCursor.classList.add("time-cursor")
        timeCursor.setAttribute("id", `time-cursor-${id}`)

        igv_column.appendChild(timeCursor)
        
        timeCursor.style.left = "0%"
        for (var i = 0; i < cursor_samples; i++) {
            moveCursor(i)
        }

        function moveCursor(i) {
            setTimeout(() => {
                timeCursor.style.left = `${i/cursor_samples * 100}%`
            }, i * cursor_samplingPeriod * 1000)
        }

        setTimeout(() => {timeCursor.remove()}, cursor_samples * cursor_samplingPeriod * 1000 + 10)

    }

    updateView() {
        if(this.signals) {
            console.log(this.chr, this.signals.length)
        }
    }

}
