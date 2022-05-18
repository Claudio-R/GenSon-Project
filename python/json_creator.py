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
                "name": "Raw Data Sonification"
            },
            {
                "name": "Statistical Sonification"
            },
            {
                "name": "Clustering Sonification"
            },
            {
                "name":"High-level Feature Sonification"
            }
        ]
    }
], open("../data/available_sonifications.json", "w")
)