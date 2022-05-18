# The main python client for performing analysis.
# It is able to send OSC messages to control supercollider.

import argparse
import sys

from pythonosc import dispatcher
from pythonosc import osc_server
from pythonosc import udp_client

import numpy as np

def parseArguments(parser):
  parser.add_argument("--sendIP", default="127.0.0.1", help="The ip of the OSC server")
  parser.add_argument("--sendPort", type=int, default=57120, help="The port the OSC server is listening on")
  parser.add_argument("--listenIP", default="127.0.0.1", help="The ip to listen on")
  parser.add_argument("--listenPort", type=int, default=8000, help="The port to listen on")
  return parser.parse_args()

def initOSC(args, dispatcher):
  client = udp_client.SimpleUDPClient(args.sendIP, args.sendPort)
  server = osc_server.ThreadingOSCUDPServer((args.listenIP, args.listenPort), dispatcher)
  print("Sending message to {}:{}".format(args.sendIP, args.sendPort))
  print("Serving on {}".format(server.server_address))
  return client, server

if __name__ == "__main__":

  parser = argparse.ArgumentParser()
  args = parseArguments(parser)
  dispatcher = dispatcher.Dispatcher()
  client, server = initOSC(args, dispatcher)

  load = input("\nWant to load raw data on SuperCollider? [y/n]\n")
  if load == "y":
    H3K4me3 = np.load('../../data/Binary/chr1/H3K4me3.npy')
    H3K9me3 = np.load('../../data/Binary/chr1/H3K9me3.npy')
    H3K27me3 = np.load('../../data/Binary/chr1/H3K27me3.npy')
    H3K27ac = np.load('../../data/Binary/chr1/H3K27ac.npy')
    H3K36me3 = np.load('../../data/Binary/chr1/H3K36me3.npy')
    H3K79me2 = np.load('../../data/Binary/chr1/H3K79me2.npy')

    client.send_message("/signals", ["H3K4me3", "H3K9me3", "H3K27me3", "H3K27ac", "H3K36me3", "H3K79me2"])

    buffer_size = 10039
    for i in range(0, H3K4me3.shape[0] , buffer_size):
      client.send_message("/H3K4me3", (0, H3K4me3[i : i + buffer_size].tolist()))
      client.send_message("/H3K9me3", [1, H3K9me3[i : i + buffer_size].tolist()])
      client.send_message("/H3K27me3", [2, H3K27me3[i : i + buffer_size].tolist()])
      client.send_message("/H3K27ac", [3, H3K27ac[i : i + buffer_size].tolist()])
      client.send_message("/H3K36me3", [4, H3K36me3[i : i + buffer_size].tolist()])
      client.send_message("/H3K79me2", [5, H3K79me2[i : i + buffer_size].tolist()])
    print("data sent")

  # MAIN LOOP
  procedure = input("How to proceed?\n1. Raw data sonification\n2. Statistical sonification\n3. Exit\n")
  while(procedure != "3"):
    client.send_message("/sonification", int(procedure))
    procedure = input("How to proceed?\n1. Raw data sonification\n2. Statistical sonification\n3. Exit\n")
  sys.exit()

