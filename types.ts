
export type Category = '上衣' | '下著' | '內搭' | '外套' | '鞋子' | '配飾' | '其他';

export interface ClothingItem {
  id: string;
  image: string; // Base64
  category: Category;
  description: string;
  dateAdded: number;
}

export interface AnalysisResult {
  category: Category;
  description: string;
  stylingTips: string;
  raw: string;
}

export interface ShopItem {
  brand: string;
  name: string;
  price: number;
  category: string;
  reason: string;
  purchaseUrl: string; // New field for clickable links
}

export interface ShopRecommendation {
  items: ShopItem[];
  styleAnalysis: string;
}

export enum AppTab {
  UPLOAD = 'upload',
  WARDROBE = 'wardrobe',
  FITTING_ROOM = 'fitting',
  SHOPPING = 'shopping'
}

export enum ProcessState {
  IDLE,
  CAMERA,
  ANALYZING,
  GENERATING_TRYON,
  SUCCESS,
  ERROR
}
