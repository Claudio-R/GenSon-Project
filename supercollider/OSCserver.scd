( //INIT THE SYSTEM
n = NetAddr("127.0.0.1"); //listenTo 57120
m = NetAddr("127.0.0.1"); //sendTo 8000

~names = List.newClear();
~bin = List.newClear();

~dispatchers.do({ |item| item.free; });
~dispatchers = List.newClear();

~signals_dispatcher.free;
~signals_dispatcher = OSCFunc.new({
	|msg, time, addr, recvPort|
	msg.removeAt(0);
	msg.do{
		|item|
		~names.add(item);
		~bin.add(Array.newClear());
		~dispatchers.add(
			OSCFunc.new({
				|histone, time_sig, addr_sig, recvPort_sig|

				var name = histone.removeAt(0);
				var idx = histone.removeAt(0);

				histone.removeAt(0);
				histone.removeAt(histone.size - 1);

				~bin[idx] = ~bin[idx] ++ histone;
			}, item.asSymbol, n).add
	)};
}, \signals, n, 57120).add;

~sonification_dispatcher.free;
~sonification_dispatcher = OSCFunc.new({
	arg msg, time, addr, recvPort;
	msg.postln;
	switch (msg[1],
		1, {
			"Sonifying raw signals...".postln;
			//s.record(duration: 20);
			~rawDataSonification.value;
		},
		2, {
			"Sonifying statistical properties...".postln;

		},
		{
			"Exiting".postln;
			s.freeAll;
		}
	);
}, "/sonification", n, 57120).add;

)