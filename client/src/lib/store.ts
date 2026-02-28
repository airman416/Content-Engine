import { create } from "zustand";
import type { SourcePost, Draft } from "./db";

export type PlatformTab = "linkedin" | "twitter" | "instagram" | "newsletter" | "quote";

interface HopperState {
  sourcePosts: SourcePost[];
  setSourcePosts: (posts: SourcePost[]) => void;

  selectedPostIndex: number;
  setSelectedPostIndex: (index: number) => void;
  moveSelection: (direction: "up" | "down") => void;

  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  updateDraft: (id: number, content: string) => void;

  activeTab: PlatformTab;
  setActiveTab: (tab: PlatformTab) => void;

  isAiLoading: boolean;
  setAiLoading: (loading: boolean) => void;

  haterTooltip: string | null;
  setHaterTooltip: (text: string | null) => void;

  shaanMode: boolean;
  toggleShaanMode: () => void;

  soundEnabled: boolean;
  toggleSound: () => void;

  showTrash: boolean;
  setShowTrash: (show: boolean) => void;

  profilePhoto: string | null;
  setProfilePhoto: (url: string | null) => void;

  isFeedLoading: boolean;
  setFeedLoading: (loading: boolean) => void;

  assetBgColor: string;
  setAssetBgColor: (color: string) => void;
  assetTextColor: string;
  setAssetTextColor: (color: string) => void;
  assetFont: string;
  setAssetFont: (font: string) => void;
  assetDimension: "1080x1080" | "1080x1350" | "1080x1920";
  setAssetDimension: (dim: "1080x1080" | "1080x1350" | "1080x1920") => void;
  assetAlign: "left" | "center" | "right";
  setAssetAlign: (align: "left" | "center" | "right") => void;
  mockupBgColor: string;
  setMockupBgColor: (color: string) => void;
}

export const useHopperStore = create<HopperState>((set, get) => ({
  sourcePosts: [],
  setSourcePosts: (posts) => set({ sourcePosts: posts }),

  selectedPostIndex: 0,
  setSelectedPostIndex: (index) => set({ selectedPostIndex: index }),
  moveSelection: (direction) => {
    const { selectedPostIndex, sourcePosts } = get();
    if (direction === "up" && selectedPostIndex > 0) {
      set({ selectedPostIndex: selectedPostIndex - 1 });
    } else if (
      direction === "down" &&
      selectedPostIndex < sourcePosts.length - 1
    ) {
      set({ selectedPostIndex: selectedPostIndex + 1 });
    }
  },

  drafts: [],
  setDrafts: (drafts) => set({ drafts }),
  updateDraft: (id, content) => {
    const { drafts } = get();
    set({
      drafts: drafts.map((d) =>
        d.id === id ? { ...d, content, updatedAt: new Date().toISOString() } : d,
      ),
    });
  },

  activeTab: "linkedin",
  setActiveTab: (tab) => set({ activeTab: tab }),

  isAiLoading: false,
  setAiLoading: (loading) => set({ isAiLoading: loading }),

  haterTooltip: null,
  setHaterTooltip: (text) => set({ haterTooltip: text }),

  shaanMode: false,
  toggleShaanMode: () => set((s) => ({ shaanMode: !s.shaanMode })),

  soundEnabled: true,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  showTrash: false,
  setShowTrash: (show) => set({ showTrash: show }),

  profilePhoto: null,
  setProfilePhoto: (url) => set({ profilePhoto: url }),

  isFeedLoading: false,
  setFeedLoading: (loading) => set({ isFeedLoading: loading }),

  assetBgColor: "#F5F5F0",
  setAssetBgColor: (color) => set({ assetBgColor: color }),
  assetTextColor: "#1B4332",
  setAssetTextColor: (color) => set({ assetTextColor: color }),
  assetFont: "Inter",
  setAssetFont: (font) => set({ assetFont: font }),
  assetDimension: "1080x1080",
  setAssetDimension: (dim) => set({ assetDimension: dim }),
  assetAlign: "center",
  setAssetAlign: (align) => set({ assetAlign: align }),
  mockupBgColor: "#F0EDE6",
  setMockupBgColor: (color) => set({ mockupBgColor: color }),
}));
