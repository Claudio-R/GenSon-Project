// INIT THE SYSTEM
load("C:/Users/mw/Desktop/GenSon Project/src/supercollider/init.scd");

// SYNTHDEFs: [binaryBuf]
load("C:/Users/mw/Desktop/GenSon Project/src/supercollider/synths.scd");

// OSC SERVER: [~signals_dispatcher, ~\name_dispatcher]
load("C:/Users/mw/Desktop/GenSon Project/src/supercollider/OSCserver.scd");

// SONIFICATIONS: [rawDataSonification]
load("C:/Users/mw/Desktop/GenSon Project/src/supercollider/sonifications.scd");

(
/*s.record(path: "C:/Users/mw/vscode-projects/supercollider/records/sixHistones_100Hz_0.05sec_10.0inharmonicity_120sec.aiff", duration: 121);*/
/*~rawDataSonification.value(fundFreq: 100, fundDur: 0.05, fundAmp: 0.05, maxInharmonicity: 10.0, totalDuration: 120, arr: [0, 1, 2, 3, 4, 5]);*/
)

// CLEAN UP
//load("C:/Users/mw/Desktop/GenSon Project/src/supercollider/cleanup.scd")

"completed".postln;