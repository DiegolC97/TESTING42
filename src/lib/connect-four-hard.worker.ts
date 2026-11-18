/**
 * Web Worker that runs the Hard search off the main thread so the page stays
 * responsive while the computer thinks. Messages carry a request id so the
 * page can ignore replies for positions it has already left.
 */

import { chooseHardColumn } from "./connect-four-hard";
import type { Board } from "./connect-four";

export type HardRequest = { id: number; board: Board };
export type HardResponse = { id: number; col: number };

self.onmessage = (event: MessageEvent<HardRequest>) => {
  const { id, board } = event.data;
  const response: HardResponse = { id, col: chooseHardColumn(board) };
  self.postMessage(response);
};
