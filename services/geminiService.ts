
import { GoogleGenAI, Type } from "@google/genai";

// テスト用のサンプルデータ
const MOCK_DATA = [
  {
    storeName: "函館五稜郭公園前店",
    prefecture: "北海道",
    address: "北海道 函館市 五稜郭町30-14",
    lastVisitDate: "2024/05/20",
    visitCount: 3,
    latitude: 41.7946,
    longitude: 140.7541
  },
  {
    storeName: "スターバックス リザーブ ロースタリー 東京",
    prefecture: "東京都",
    address: "東京都 目黒区 青葉台2-19-23",
    lastVisitDate: undefined,
    visitCount: undefined,
    latitude: 35.6491,
    longitude: 139.6925
  },
  {
    storeName: "太宰府天満宮表参道店",
    prefecture: "福岡県",
    address: "福岡県 太宰府市 宰府3-2-43",
    lastVisitDate: "2024/01/10",
    visitCount: 1,
    latitude: 33.5215,
    longitude: 130.5310
  }
];

export const extractStampData = async (base64Image: string, isMock: boolean = false) => {
  if (isMock) {
    console.log("Gemini API: モックモードで実行中");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return MOCK_DATA;
  }

  // Fix: Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  console.log("Gemini API: 解析開始...");
  // Fix: Select gemini-3-pro-preview for complex reasoning and data extraction tasks.
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    You are an OCR engine for Starbucks Japan "My Store Passport".
    The input can be a SINGLE stamp detail page OR a GRID/LIST of multiple stamps.

    EXTRACTION FIELDS:
    1. storeName: EXACT name (e.g., "目黒店"). 
    2. prefecture: e.g., "東京都"
    3. lastVisitDate: "YYYY/MM/DD" or null if not visible.
    4. visitCount: Integer or null if not visible.
    5. address: Full Japanese address.
    6. coordinates: Numeric latitude/longitude.

    Return JSON with a "stamps" array.
  `;

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  try {
    // Fix: Call generateContent with model and contents as per guidelines.
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        // Fix: Use thinkingConfig for Gemini 3 models to improve extraction accuracy.
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stamps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  storeName: { type: Type.STRING },
                  prefecture: { type: Type.STRING },
                  lastVisitDate: { type: Type.STRING },
                  visitCount: { type: Type.NUMBER },
                  address: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                },
                required: ["storeName", "prefecture", "address"],
              },
            },
          },
          required: ["stamps"],
        },
      },
    });

    // Fix: Access response text via property, not method.
    const text = response.text;
    if (!text) throw new Error("AIから空のレスポンスが返されました。");
    
    const parsed = JSON.parse(text);
    return (parsed.stamps || []).map((s: any) => ({
      ...s,
      latitude: typeof s.latitude === 'number' && !isNaN(s.latitude) ? s.latitude : undefined,
      longitude: typeof s.longitude === 'number' && !isNaN(s.longitude) ? s.longitude : undefined,
      visitCount: (s.visitCount === null || s.visitCount === undefined) ? undefined : s.visitCount,
      lastVisitDate: (s.lastVisitDate === null || s.lastVisitDate === undefined) ? undefined : s.lastVisitDate,
    }));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "解析中にエラーが発生しました。");
  }
};
