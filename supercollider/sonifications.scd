(
~rawDataSonification = {
	arg fundFreq = 40, fundDur = 1.0, fundAmp = 0.05, maxInharmonicity = 0.0, totalDuration = 15.0 ... arr;
	var data, names, e;

	data = List.newClear();
	names = List.newClear();

	if(arr.size == 0,
		{
			data = ~bin;
			names = ~names;
		},
		{
			arr.do({
				arg idx, i;
				data.add(Array.newClear());
				data[i] = ~bin[idx];
				names.add(~names[idx]);
			});
		}
	);

	// CREATING BUFFERS
	~buffers = Array.newClear(names.size);

	data.do({
		arg item, i;
		~buffers[i] = Buffer.alloc(
			server: s,
			numFrames: item.size,
			numChannels: 1
		);
		~buffers[i].loadCollection(item);
	});

	e = Buffer.sendCollection(s, Env.perc(0.01, 0.5).discretize, 1);

	~buffers.do({
		arg buf, i;
		var freq = fundFreq * (1 + i) + rrand(0.0, fundFreq * (maxInharmonicity / 100));
		var dur =  fundDur + (fundFreq / freq);
		var amp = (fundAmp * ( (fundFreq / freq) ** 0.2) ) * (1 / ~buffers.size);
		var pan;
		if(~buffers.size <= 1, { pan = 0; }, { pan = (i * (2 / (~buffers.size - 1))) - 1; });

		postf("%: [frequecy %, duration %, amplitude %, panning %]\n", names[i], freq, dur, amp, pan);

		Synth(\binaryBuf,
			args: [
				\buf, buf.bufnum,
				\envbuf, e,
				\freq, freq,
				\dur, dur,
				\rate, buf.duration / totalDuration,
				\amp, amp,
				\pan, pan
			]
		);
	});
}
)

