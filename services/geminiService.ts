
import { GoogleGenAI, Type } from "@google/genai";
import '../shim';

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

  // Fix: Strictly follow the mandatory hybrid environment variable access format as requested.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : '');
  console.log("Gemini API Key:", apiKey);
  const ai = new GoogleGenAI({apiKey:  apiKey });

  console.log("Gemini API: 解析開始...");
  
  // Set extraction logic within systemInstruction for enhanced model consistency.
  const systemInstruction = `
    あなたはスターバックスの「マイストアパスポート」のスタンプ画像を解析する専門家です。
    画像から以下の情報を抽出し、JSON形式で返却してください。

    【抽出項目】
    1. storeName: 店舗名（例：「目黒店」）。画像に記載されている正確な名称。
    2. prefecture: 都道府県（例：「東京都」）。
    3. lastVisitDate: 最終訪問日（"YYYY/MM/DD"形式）。不明な場合は null。
    4. visitCount: 訪問回数（数値）。不明な場合は null。
    5. address: 店舗のフル住所。
    6. latitude: 店舗の緯度。あなたの知識ベースから正確な数値を特定してください。
    7. longitude: 店舗の経度。あなたの知識ベースから正確な数値を特定してください。

    【重要】
    - 入力画像には複数のスタンプが並んでいる（グリッド表示）場合と、1つの店舗の詳細画面の場合があります。
    - 画像にスタンプが一枚も検出されない場合は、空の配列を返却してください。
    - グリッド表示の場合、最終訪問日と訪問回数は nullになります。
    - 1つの店舗の詳細画面の場合、最終訪問日と訪問回数は記載されています。
    - 全ての検出された店舗を stamps 配列に含めてください。
    - 緯度・経度は住所から推測するのではなく、可能な限り実際の店舗位置に合致する正確な値を出力してください。
  `;

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  try {
    // Upgrading to gemini-3-pro-preview for complex multimodal reasoning tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [imagePart, { text: "画像から店舗スタンプの情報を抽出してください。" }] },
      config: {
        systemInstruction: systemInstruction,
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

    // Directly access .text property as per the Google GenAI SDK rules (property, not method).
    const text = response.text;
    if (!text) throw new Error("AIから空のレスポンスが返されました。");
    
    const parsed = JSON.parse(text.trim());
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
