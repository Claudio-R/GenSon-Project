class RawDataSonification {

    /**
     * At the end, we will have the complete grain buffer
     * @param {*} numChannels 
     * @param {*} parameters 
     */
    constructor(multiChannelInputBuffer, parameters) {
        
        this.outputWindow = document.querySelector('.output-window-content');
        this.outputWindow.innerHTML = "RAW DATA SONIFICATION<br/>";
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // THE FOLLOWING ARE ALL ASYNCHRONOUS OPERATIONS IN ORDER NOT TO BLOCKE THE UI
        const numChannels = multiChannelInputBuffer.numberOfChannels;

        // 1. SYNTHETIZE THE GRAINS (CREATE OSCILLATORS AND ENV NODES) !NO DETUNE FOR NOW!
        this.outputWindow.innerHTML += "Generating Grains...";
        this.createGrains(numChannels, parameters).then((config) => {
        
            // 2. RENDER THE GRAINS ON A SINGLE CHANNEL BUFFER
            this.renderGrains(config).then((renderedBuffer) => {         
                
                // 3. SPLIT THE GRAINS INTO MULTI CHANNEL BUFFERS
                //this.outputWindow.innerHTML += "<br/>Collecting signals...";
                this.getMultiChannelGrainBuffer(renderedBuffer, numChannels, parameters).then((multiChannelGrainBuffer) => {
                    this.multiChannelGrainBuffer = multiChannelGrainBuffer;

                    // 4. PROCESS THE FINAL SONIFICATION
                    // this.outputWindow.innerHTML += "<br/>Final processing has started...";
                    this.process(multiChannelInputBuffer).then((multiChannelOutputBuffer) => {
                        console.log(multiChannelOutputBuffer);
    
                        this.play(multiChannelOutputBuffer);
                        this.sonifiedSignals = multiChannelOutputBuffer;
                    });
                });
            });
        });
    }

    /**
     * Synthetize the grains
     * @param {*} numChannels 
     * @param {*} parameters 
     * @returns 
     */
    createGrains(numChannels, parameters) {
        return new Promise((resolve) => {

            var offlineCtx = new OfflineAudioContext(1, numChannels * parameters.Duration * 44100, 44100);

            var oscillators = [];
            var envNodes = []

            for(var i = 0; i < numChannels; i++) {
                var oscillator = offlineCtx.createOscillator();
                var frequency = parameters.Frequency * (i + 1) + Math.random() * parameters.Detune * parameters.Frequency
                oscillator.frequency.value = frequency;
                
                this.outputWindow.innerHTML += "<br/>Grain " + i + ": FREQUENCY: " + frequency;
                
                oscillator.type = 'sine';

                var gainNode = offlineCtx.createGain();
                var normalizationFactor = Math.pow(10, -3)
                gainNode.gain.value = parameters.Gain * normalizationFactor;

                var envNode = offlineCtx.createGain();
                envNode.gain.value = 0;
                                
                oscillator.connect(gainNode);
                gainNode.connect(envNode);
                envNode.connect(offlineCtx.destination);
                
                oscillators.push(oscillator);
                envNodes.push(envNode);
            }

            const config = {
                "offlineCtx": offlineCtx,
                "oscillators": oscillators,
                "envNodes": envNodes,
                "parameters": parameters
            };

            return resolve(config);
        });
    }

    /**
     * Render the grains on a single channel buffer
     * @param {*} config configuration object definiing the grains
     * @returns 
     */
    renderGrains(config) {
        return new Promise((resolve, reject) => {
            
            const offlineCtx = config.offlineCtx;
            var startTime = Number(offlineCtx.currentTime);
            var duration = config.parameters.Duration;

            function waitForGrain(grainIndex) {
                return new Promise((resolve, reject) => {
                    if(grainIndex < config.oscillators.length) {
                        var start = startTime + (grainIndex * duration);
                        var end = start + duration;
                        config.oscillators[grainIndex].start(start);
                        config.envNodes[grainIndex].gain.setValueAtTime(1, start + 0.01);
                        config.envNodes[grainIndex].gain.setValueCurveAtTime(new Float32Array([1, 0.5, 0]), start + 0.1, duration);
                        config.oscillators[grainIndex].stop(end);                        
                        resolve(waitForGrain(grainIndex + 1));
                    } else {
                        offlineCtx.startRendering().then((renderedBuffer) => {
                            resolve(renderedBuffer);
                        });
                    }
                });
            }

            waitForGrain(0).then((renderedBuffer) => {
                resolve(renderedBuffer);
            });
        });
    }

    /**
     * Split the rendered array into a multiChannelBuffer
     * @param {*} renderedBuffer 
     * @param {*} parameters 
     * @returns 
     */
    getMultiChannelGrainBuffer(renderedBuffer, numChannels, parameters) {
        return new Promise((resolve) => {
            var audioContext = new AudioContext();
            var multiChannelGrainBuffer = audioContext.createBuffer(numChannels, parameters.Duration * 44100, 44100);
            for(var i = 0; i < numChannels; i++) {
                var channelBuffer = multiChannelGrainBuffer.getChannelData(i);
                var startIndex = i * parameters.Duration * 44100;
                for(var j = 0; j < channelBuffer.length; j++) {
                    channelBuffer[j] = renderedBuffer.getChannelData(0)[startIndex + j];
                }
            }
            resolve(multiChannelGrainBuffer);
        })
    }

    /**
     * Once the grains are created and stored in a multiChannelBuffer, they can be used to create an output buffer
     * which will be played by the audio context.
     * @param {*} audioContext 
     * @param {*} multiChannelInputBuffer multiChannelBuffer containing the signals to be processed, actually this could also be a 2D array
     * @param {*} parameters dictionary containing the parameters of the synthesis
     */
    process(multiChannelInputBuffer) {
        return new Promise((resolve) => {

            /** By principle, we can  use grains of different sizes passing a grainDuration parameter, but for now we assume the same duration for each grain */

            const duration = 15;
            const audioContext = new AudioContext();
            
            // Define the minimum length which allow the buffer to be played at audio rate for the whole desired duration
            const N_ar = audioContext.sampleRate * duration;
            
            // Define the minimum length to contain the data
            const overSamplingFactor = Math.round(N_ar / multiChannelInputBuffer.getChannelData(0).length);
            const N_data = multiChannelInputBuffer.getChannelData(0).length * overSamplingFactor + this.multiChannelGrainBuffer.getChannelData(0).length - overSamplingFactor;
            
            const outputBufferLength = Math.max(N_ar, N_data)

            //console.log("N_ar: " + N_ar + " N_data: " + N_data + " outputBufferLength: " + outputBufferLength);

            const multiChannelOutputBuffer = audioContext.createBuffer(multiChannelInputBuffer.numberOfChannels, outputBufferLength, audioContext.sampleRate);
                        
            for(let channelNum = 0; channelNum < multiChannelInputBuffer.numberOfChannels; channelNum++) {
                console.log("Processing signal " + (channelNum + 1) + " of " + multiChannelInputBuffer.numberOfChannels);
                
                //this.outputWindow.innerHTML += "<br/>Processing signal " + (channelNum + 1) + " of " + multiChannelInputBuffer.numberOfChannels;

                let channelBuffer = multiChannelInputBuffer.getChannelData(channelNum);
                let grainBuffer = this.multiChannelGrainBuffer.getChannelData(channelNum);
                let outputBuffer = multiChannelOutputBuffer.getChannelData(channelNum);
                for(let i = 0; i < channelBuffer.length; i++) {
                    if(channelBuffer[i] > 0) {
                        let grainStartIndex = i * overSamplingFactor;
                        let grainEndIndex = grainStartIndex + grainBuffer.length;

                        for(let j = grainStartIndex; j < grainEndIndex; j++) {
                            outputBuffer[j] += grainBuffer[j - grainStartIndex];
                        }
                    } else {
                        for(let j = 0; j < overSamplingFactor; j++) {
                            outputBuffer[j + i * overSamplingFactor] += 0;
                        }
                    }
                }
            }

            //console.log("Sonification completed");

            this.outputWindow.innerHTML += "<br/>Sonification Completed!";
            resolve(multiChannelOutputBuffer);

        });
    }

    play(buffer) {

        if(!buffer) {
            buffer = this.sonifiedSignals;
        }

        // RESUME THE AUDIO CONTEXT
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start();
        this.launchTimeCursor(buffer.duration)
        source.stop(this.audioCtx.currentTime + buffer.duration);
    }

    launchTimeCursor(bufferDuration) {

        const duration = bufferDuration - this.multiChannelGrainBuffer.duration; // il cursore è più veloce
        console.log("Duration: " + duration);
        console.log("Buffer duration: " + bufferDuration);
        console.log("Grain duration: " + this.multiChannelGrainBuffer.duration);

        var cursor_samples = 10000
        var cursor_sampleRate = cursor_samples/duration
        var cursor_samplingPeriod = 1/cursor_sampleRate

        var igv_column = document.querySelector(".igv-column")
        var timeCursor = document.createElement("div")
        timeCursor.classList.add("time-cursor")

        igv_column.appendChild(timeCursor)
        
        timeCursor.style.left = "0%"

        function moveCursor(i) {
            setTimeout(() => {
                timeCursor.style.left = `${i/cursor_samples * 100}%`
            }, i * cursor_samplingPeriod * 1000)
        }

        for (var i = 0; i < cursor_samples; i++) {
            moveCursor(i)
        }

        setTimeout(() => {timeCursor.remove()}, bufferDuration * 1000)

    }
}

export default RawDataSonification;