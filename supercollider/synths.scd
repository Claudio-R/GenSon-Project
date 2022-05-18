(
// GRANULAR SYNTHESIS USING BINS AS TRIGGERS
SynthDef(\binaryBuf, {
	arg out = 0, buf, envbuf, freq, dur, rate, amp, pan;
	var sig;
	sig = GrainSin.ar(
		numChannels: 1,
		trigger: PlayBuf.ar(
			numChannels: 1,
			bufnum: buf,
			rate: BufRateScale.kr(buf) * rate,
		),
		dur: dur,
		freq: freq,
		envbufnum: envbuf,
		maxGrains: 1024,
	);
	sig = Pan2.ar(sig, pan);
	Out.ar(out, sig * amp);
}).add;
)