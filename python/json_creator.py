# Creata a JSON file with the data from the binary database for chr1 and another JSON file
# containing a list of the available sonification procedures.

import numpy as np
import json

H3K4me3 = np.load('../data/Binary/chr1/H3K4me3.npy')
H3K9me3 = np.load('../data/Binary/chr1/H3K9me3.npy')
H3K27me3 = np.load('../data/Binary/chr1/H3K27me3.npy')
H3K27ac = np.load('../data/Binary/chr1/H3K27ac.npy')
H3K36me3 = np.load('../data/Binary/chr1/H3K36me3.npy')
H3K79me2 = np.load('../data/Binary/chr1/H3K79me2.npy')

colors = ["#ee3333", "#33ee33", "#3333ee", "#eeee33", "#33eeee", "#ee33ee"]

# upsampling_factor = 16

# upsampled_H3K4me3 = np.zeros(16 * H3K4me3.shape[0])
# for i in range(H3K4me3.shape[0]):
#     upsampled_H3K4me3[i*upsampling_factor:(i+1)*upsampling_factor] = H3K4me3[i]

# upsampled_H3K9me3 = np.zeros(trackLength)
# for i in range(H3K9me3.shape[0]):
#     upsampled_H3K9me3[i*upsampling_factor:(i+1)*upsampling_factor] = H3K9me3[i]

# upsampled_H3K27me3 = np.zeros(trackLength)
# for i in range(H3K27me3.shape[0]):
#     upsampled_H3K27me3[i*upsampling_factor:(i+1)*upsampling_factor] = H3K27me3[i]

# upsampled_H3K27ac = np.zeros(trackLength)
# for i in range(H3K27ac.shape[0]):
#     upsampled_H3K27ac[i*upsampling_factor:(i+1)*upsampling_factor] = H3K27ac[i]

# upsampled_H3K36me3 = np.zeros(trackLength)
# for i in range(H3K36me3.shape[0]):
#     upsampled_H3K36me3[i*upsampling_factor:(i+1)*upsampling_factor] = H3K36me3[i]

# upsampled_H3K79me2 = np.zeros(trackLength)
# for i in range(H3K79me2.shape[0]):
#     upsampled_H3K79me2[i*upsampling_factor:(i+1)*upsampling_factor] = H3K79me2[i]


json.dump(
    [
        {
            "chr": "chr1",
            "histones": [
                {
                    "name": "H3K4me3",
                    "url_track": "../data/PeaksParsed/chr1/chr1_GM12878_H3K4me3_ENCFF295GNH.narrowPeak",
                    "binary_data": H3K4me3.tolist()
                },
                {
                    "name": "H3K9me3",
                    "url_track": "../data/PeaksParsed/chr1/chr1_GM12878_H3K9me3_ENCFF682WIQ.narrowPeak",
                    "binary_data": H3K9me3.tolist()
                },
                {
                    "name": "H3K27me3",
                    "url_track": "../data/PeaksParsed/chr1/chr1_GM12878_H3K27ac_ENCFF816AHV.narrowPeak",
                    "binary_data": H3K27me3.tolist()
                },
                {
                    "name": "H3K27ac",
                    "url_track": "../data/PeaksParsed/chr1/chr1_GM12878_H3K27me3_ENCFF001SUI.broadPeak",
                    "binary_data": H3K27ac.tolist()
                }, 
                {
                    "name": "H3K36me3",
                    "url_track": "../data/PeaksParsed/chr1/chr1_GM12878_H3K36me3_ENCFF001SUJ.broadPeak",
                    "binary_data": H3K36me3.tolist()
                },
                {
                    "name": "H3K79me2",
                    "url_track": "../data/PeaksParsed/chr1/chr1_GM12878_H3K79me2_ENCFF001SUN.broadPeak",
                    "binary_data": H3K79me2.tolist()
                }
            ]
        }
    ], open("../data/epigenome.json", "w")
)

available_sonifications = ["Raw Data Sonification", "Statistical Sonification", "High-level Feature Sonification"]
json.dump(
[
    {
        "chr": "chr1",
        "sonifications": [
            {
                "type": "Raw Data Sonification",
                "formatted_name": "raw-data-sonification",
                "init_params": [
                    { 
                        "name": "Gain",
                        "value": 0.5,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.001
                    },
                    { 
                        "name": "Frequency",
                        "value": 250.0,
                        "min": 50.0,
                        "max": 500.0,
                        "step": 0.1
                    },
                    {
                        "name": "Duration",
                        "value": 2.5,
                        "min": 0.01,
                        "max": 5.0,
                        "step": 0.01
                    },
                    {
                        "name": "Detune",
                        "value": 0.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.01
                    }
                ]
            },
            {
                "type": "Statistical Sonification",
                "formatted_name": "statistical-sonification",
                "init_params": [
                    { 
                        "name": "Volume",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    },
                    { 
                        "name": "Pitch",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    },
                    { 
                        "name": "Duration",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    }
                ]
            },
            {
                "type": "Clustering Sonification",
                "formatted_name": "clustering-sonification",
                "init_params": [
                    { 
                        "name": "Volume",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    },
                    { 
                        "name": "Pitch",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    },
                    { 
                        "name": "Duration",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    }
                ]
            },
            {
                "type":"High-level Feature Sonification",
                "formatted_name": "high-level-features-sonification",
                "init_params": [
                    { 
                        "name": "Volume",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    },
                    { 
                        "name": "Pitch",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    },
                    { 
                        "name": "Duration",
                        "value": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.1
                    }
                ]
            }
        ]
    }
]
, open("../data/available_sonifications.json", "w")
)