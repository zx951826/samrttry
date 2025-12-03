
import { GoogleGenAI, Type } from "@google/genai";
import { ShopRecommendation } from "../types";

// Lazy initialization of the AI client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found. Please check your environment variables.");
    throw new Error("API Key 未設定。請在設定中輸入您的 Google API Key。");
  }
  return new GoogleGenAI({ apiKey });
};

// Categorization Prompt
const SYSTEM_INSTRUCTION_ANALYSIS = `
你是專業的智能櫥窗管理員。請分析圖片中的衣物。
請嚴格按照以下 JSON 格式回傳，不要有 Markdown 標記。
類別(category)只能是以下之一： '上衣', '下著', '內搭', '外套', '鞋子', '配飾', '其他'。
`;

/**
 * Analyzes clothing image to get category and styling tips.
 */
export const analyzeClothingImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<{
  category: string;
  description: string;
  stylingTips: string;
}> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "分析這件衣物。請提供類別、詳細描述(材質、風格)以及3個穿搭建議(包含場合)。" },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['上衣', '下著', '內搭', '外套', '鞋子', '配飾', '其他'] },
            description: { type: Type.STRING },
            stylingTips: { type: Type.STRING }
          },
          required: ["category", "description", "stylingTips"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("無法分析圖片，請稍後再試。");
  }
};

/**
 * Generates a virtual try-on image using Gemini Image Editing capabilities.
 */
export const generateTryOn = async (
  userImageBase64: string, 
  clothingImagesBase64: string[]
): Promise<{ imageUrl: string | null; advice: string }> => {
  try {
    const ai = getAiClient();
    const parts: any[] = [
      { inlineData: { mimeType: 'image/jpeg', data: userImageBase64 } }
    ];

    clothingImagesBase64.forEach((img) => {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
    });

    const prompt = `
      這是一位使用者的照片(第一張圖)以及他想嘗試的衣物(後續圖片)。
      任務：
      1. 生成一張這名使用者穿著這些衣物的照片。請保持使用者的人臉特徵、體型和背景氛圍。
      2. 根據使用者的臉型和服裝風格，提供髮型建議。
      
      請回傳生成的圖片以及針對整體造型的文字建議。
    `;
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts },
      config: {}
    });

    let imageUrl = null;
    let advice = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          advice += part.text;
        }
      }
    }

    return { imageUrl, advice };

  } catch (error) {
    console.error("Gemini Try-On Error:", error);
    throw new Error("虛擬試穿生成失敗，請稍後再試。");
  }
};

/**
 * Recommends shop items based on user photo style and selected brands.
 */
export const recommendShopOutfit = async (
  userImageBase64: string,
  brands: string[]
): Promise<ShopRecommendation> => {
  try {
    const ai = getAiClient();
    const brandStr = brands.join('、');
    const prompt = `
      分析這張用戶照片的風格、身形和膚色。
      請從以下台灣品牌中：${brandStr}，挑選一套適合他的當季穿搭(2-3件單品)。
      請提供具體的商品名稱(不需要完全準確的型號，但要符合該品牌風格)、預估台幣價格、以及推薦理由。
      
      重要：請為每件商品生成一個 'purchaseUrl'。這應該是一個 Google 搜尋連結，格式為：
      'https://www.google.com/search?q=' 加上 '品牌 名稱' (例如：https://www.google.com/search?q=Uniqlo+Airism+T-shirt)。
      
      回傳格式必須為 JSON。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: userImageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styleAnalysis: { type: Type.STRING, description: "對用戶風格的分析" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  brand: { type: Type.STRING, enum: ['Uniqlo', 'GU', 'Lativ'] },
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  purchaseUrl: { type: Type.STRING, description: "購買連結 (Google Search URL)" }
                },
                required: ["brand", "name", "price", "category", "reason", "purchaseUrl"]
              }
            }
          },
          required: ["styleAnalysis", "items"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Shop Recommendation Error:", error);
    throw new Error("無法取得商品推薦，請稍後再試。");
  }
};

/**
 * Generates a try-on image for shop items (hallucinated items based on text description).
 */
export const generateShopTryOn = async (
  userImageBase64: string,
  shopItemsDescription: string
): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const prompt = `
      這是使用者的照片。請生成一張他穿著以下服裝的逼真照片：
      ${shopItemsDescription}
      
      請保持：
      1. 使用者的人臉特徵和體型。
      2. 服裝的質感與品牌風格 (Uniqlo/GU/Lativ 風格)。
      3. 自然的光影。
      
      只回傳圖片。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: userImageBase64 } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Shop Try-On Error:", error);
    return null; // Fail gracefully
  }
}
