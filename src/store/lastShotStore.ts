import { create } from "zustand";

type LastShotState = {
  carry: string;
  total: string;
  ballSpeed: string;
  clubSpeed: string;
  setLastShot: (s: Partial<LastShotState>) => void;
  reset: () => void;
};

export const useLastShotStore = create<LastShotState>((set) => ({
  carry: "",
  total: "",
  ballSpeed: "",
  clubSpeed: "",
  setLastShot: (s) => set((prev) => ({ ...prev, ...s })),
  reset: () => set({ carry: "", total: "", ballSpeed: "", clubSpeed: "" }),
}));
