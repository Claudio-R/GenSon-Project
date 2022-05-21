class RawDataSonification {

    /**
     * At the end, we will have the complete grain buffer
     * @param {*} numChannels 
     * @param {*} parameters 
     */
    constructor(numChannels, parameters) {
        // THE FOLLOWING ARE ALL ASYNCHRONOUS OPERATIONS
        // 1. SYNTHETIZE THE GRAINS
        this.createGrains(numChannels, parameters).then((resolveParameters) => {
        
            // 2. RENDER THE GRAINS ON A SINGLE CHANNEL BUFFER
            this.renderGrains(resolveParameters).then((renderedBuffer) => {         
                // Listen to the grains
                // const audioContext = new AudioContext();
                // const source = audioContext.createBufferSource();
                // source.buffer = renderedBuffer;
                // source.connect(audioContext.destination);
                // source.start();
                // source.stop(audioContext.currentTime + renderedBuffer.duration);

                // Get the grains
                
                // 3. SPLIT THE GRAINS INTO MULTI CHANNEL BUFFERS
                this.getMultiChannelBuffer(renderedBuffer, numChannels, parameters).then((multiChannelBuffer) => {
                    this.multiChannelGrainBuffer = multiChannelBuffer;
                    console.log(multiChannelBuffer);

                    // Listen to the grains
                    const audioContext = new AudioContext();
                    const source = audioContext.createBufferSource();
                    source.buffer = multiChannelBuffer;
                    source.connect(audioContext.destination);
                    source.start();
                    source.stop(audioContext.currentTime + multiChannelBuffer.duration);

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
            var envNodes = [];

            for(var i = 0; i < numChannels; i++) {
                var oscillator = offlineCtx.createOscillator();
                oscillator.frequency.value = parameters.Frequency * (i + 1);
                oscillator.type = 'sine';

                var envNode = offlineCtx.createGain();
                envNode.gain.value = 0;
                                
                oscillator.connect(envNode);
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
     * @param {*} config 
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
                        config.envNodes[grainIndex].gain.setValueCurveAtTime(new Float32Array([0, 1, 0]), start, duration);
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
    getMultiChannelBuffer(renderedBuffer, numChannels, parameters) {
        return new Promise((resolve) => {
            var audioContext = new AudioContext();
            var multiChannelBuffer = audioContext.createBuffer(numChannels, parameters.Duration * 44100, 44100);
            for(var i = 0; i < numChannels; i++) {
                var channelBuffer = multiChannelBuffer.getChannelData(i);
                var startIndex = i * parameters.Duration * 44100;
                for(var j = 0; j < channelBuffer.length; j++) {
                    channelBuffer[j] = renderedBuffer.getChannelData(0)[startIndex + j];
                }
            }
            resolve(multiChannelBuffer);
        })
    }

    /**
     * Once the grains are created and stored in a multiChannelBuffer, they can be used to create an output buffer
     * which will be played by the audio context.
     * @param {*} audioContext 
     * @param {*} multiChannelInputBuffer 
     * @param {*} parameters 
     */
    process(audioContext, multiChannelInputBuffer, parameters) {
        return new Promise((resolve) => {

            //const multiChannelGrainBuffer = this.createGrains(multiChannelInputBuffer.length, parameters);
            const duration = 15;
            const gain = parameters.gain;

            // Create an empty buffer of the right length
            var outputBufferLength = multiChannelInputBuffer[0].length;  
            for (let channelNum = 0; channelNum < multiChannelInputBuffer.numberOfChannels; channelNum++) {
                var channelBuffer = multiChannelInputBuffer.getChannelData(channelNum);
                var grainBuffer = this.multiChannelGrainBuffer.getChannelData(channelNum);
                var totalOutputLength = channelBuffer.length + grainBuffer.length - 1;
                if(totalOutputLength > outputBufferLength) {
                    outputBufferLength = totalOutputLength;
                }
            }
            outputBufferLength = Math.max(outputBufferLength, audioContext.sampleRate * duration);
            const multiChannelOutputBuffer = audioContext.createBuffer(multiChannelInputBuffer.numberOfChannels, outputBufferLength, multiChannelInputBuffer.sampleRate);
            
            /** By principle, we can  use grains of different sizes */
            const overSamplingFactor = Math.ceil(multiChannelOutputBuffer[0].length / multiChannelInputBuffer[0].length);
            multiChannelInputBuffer.forEach((channel, inputChannelIndex) => {
                channel.forEach((sample, inputSampleIndex) => {
                    var outputChannel = multiChannelOutputBuffer.getChannelData(inputChannelIndex);
                    if(sample) {
                        var outputChannelIndex = inputSampleIndex + (overSamplingFactor * inputSampleIndex);
                        var grain = this.multiChannelGrainBuffer.getChannelData(inputChannelIndex);
                        for (let i = outputChannelIndex; i < outputChannelIndex + grain.length; i++) {
                            outputChannel[i] += grain[i - outputChannelIndex] * gain;
                        }
                    }
                });
            });

            resolve(multiChannelOutputBuffer);
        });
    }
}

export default RawDataSonification;