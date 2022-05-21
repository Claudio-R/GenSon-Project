import RawDataSonification from './audioProcessors/RawDataSonification.js';

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

        /** Store all the processors in a dictionary */
        // this.audioProcessors = {}
        // this.createAudioProcessor('RawDataSonification','raw-data-sonification')

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
                var sonificationConfig = {
                    "type": selected_btn.innerHTML,
                    "formatted_name": selected_btn.id.slice(0, -4),
                    "signals": selected_signals,
                    "locus": [this.browser.referenceFrameList[0]['start'], this.browser.referenceFrameList[0]['end']],
                    "id": this.sonificationID,
                    "params": sonification["init_params"],
                }
                //console.log(selected_sonification)
                this.sonificationID++;
                this.configureSonification(sonificationConfig)
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

    // async createAudioProcessor(name, formatted_name) {   
    //     if (!this.audioCtx) {
    //       try {
    //         this.audioCtx = new AudioContext();
    //         await this.audioCtx.resume().then(() => {
    //             console.log("Audio context resumed")}
    //         );
    //         await this.audioCtx.audioWorklet.addModule(`./audioProcessors/${name}.js`).then(() => {
    //             this.audioProcessors[formatted_name] = new AudioWorkletNode(this.audioCtx, `${formatted_name}-processor`);
    //         });                    
    //       } catch(e) {
    //         console.log(e);
    //       }
    //     }      
    // }

    configureSonification(sonification) {

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
        
        // RETRIEVE CURRENT CONTROL PARAMETERS FROM UI
        var params_dict = {}
        for (let param of params) {
            var param_name = param["name"]
            var slider = document.getElementById(`${name}-${param_name}-slider`)
            var value = Number(slider.value)
            params_dict[param_name] = value        
        }

        // RETRIEVE AND TRIM THE SIGNALS TO SONIFY
        var signals_toProcess = []
        for(let signal of signals) {
            for(var i = 0; i < this.signals.length; i++) {
                if(this.signals[i]["name"] === signal) {
                    //console.log(this.signals[i]["binary_data"])
                    var trimmed_signal = this.signals[i]["binary_data"].slice(Math.floor(start), Math.floor(end))
                    //console.log(start, end)
                    signals_toProcess.push(trimmed_signal)
                }
            }
        }

        var sonificationDuration = 15;
        this.play(name, id, signals_toProcess, params_dict, sonificationDuration)
    }

    /**
     * The General idea is to load the data to process into a buffer and feed the proper audio processor
     * @param {*} name sonification formatted name
     * @param {*} signal_toProcess multi-dimensional array of data to process
     * @param {*} params_dict dictionary of control parameters
     * @param {*} duration duration of the overall sonification
     */
    async play(name, id, signals_toProcess, params_dict, duration) {
        
        // RESUME THE AUDIO CONTEXT
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // CREATE THE PROCESSOR
        // var processor = this.audioProcessors[name];
        // if (!processor) {
        //     processor = this.createAudioProcessor(name);
        //     this.audioProcessors[name] = processor;
        // }

         // CREATE MULTI CHANNEL BUFFER
        var num_channels = signals_toProcess.length;
        var buffer_length = signals_toProcess[0].length;
        var multiChannelInputbuffer = this.audioCtx.createBuffer(num_channels, buffer_length, this.audioCtx.sampleRate);
        
        // LOAD THE DATA INTO THE BUFFER
        for(var i = 0; i < num_channels; i++) {
            var channel = multiChannelInputbuffer.getChannelData(i);
            for(var j = 0; j < buffer_length; j++) {
                channel[j] = signals_toProcess[i][j]
            }
        }
        
        // INSTANTIATE THE SONIFICATION PROCESSOR
        
        console.log(multiChannelInputbuffer.numberOfChannels, params_dict)
        
        const sonificationProcessor = new RawDataSonification(multiChannelInputbuffer.numberOfChannels, params_dict);
        // await sonificationProcessor.process(this.audioCtx, multiChannelInputbuffer, params_dict).then((multiChannelOutPutbuffer) => {
        //     console.log("Processed")
        //     console.log("numChannels: ", multiChannelOutPutbuffer.length, "\nbufferLength: ", multiChannelOutPutbuffer.getChannelData(0).length)
        //     this.launchTimeCursor(id, duration)
        // });
        
        // // CREATE THE SOURCE NODE AND CONNECT IT TO THE PROCESSOR
        // // !! AUDIO SOURCE NODE APPLIES PANNING AUTOMATICALLY !!
        // var sourceNode = this.audioCtx.createBufferSource();
        // sourceNode.buffer = buffer;
        // sourceNode.connect(processor);
        // processor.connect(this.audioCtx.destination);

        // // START THE SOURCE NODE
        // sourceNode.start();
        // sourceNode.onended = () => {
        //     sourceNode.stop();
        // }
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
        setTimeout(() => {
            for (var i = 0; i < cursor_samples; i++) {
                moveCursor(i)
            }
        }, 1000) // delay to allow the igv to render the first frame

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
