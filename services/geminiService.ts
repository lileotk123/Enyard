
import { GoogleGenAI } from "@google/genai";

export class SupportAIService {
  async getSupportGuidance(query: string, appState: any) {
    // Initializing GoogleGenAI with the required apiKey object
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are the "YardKeeper AI" for EarnYard, a P2P earning and growth platform.
      
      Platform Rules:
      - Tasks pay a minimum of $0.10.
      - Daily Growth Boost: 2% daily interest on wallet balances (capped at $10/day).
      - Yard Fee: All Withdrawals are subject to a 5% Platform Fee. Users receive 95%.
      - P2P Marketplace: Users liquidate assets via Verified Agents.
      - Top-ups: 1:1 ratio, Fee-free.
      - Creator Hub: Users can deploy tasks.

      User Query: "${query}"

      Tasks:
      1. Provide helpful, concise answers.
      2. If asking about fees, refer to them as "Yard Fees".
      3. Maintain a friendly, growth-oriented, yet professional tone.
      
      Respond concisely.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Accessing .text as a property per guidelines
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "YardKeeper node congested. Please use the 'Contact Admin' tab.";
    }
  }

  async generateAutoResponse(supportRequest: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Draft a helpful, professional response to this support request: "${supportRequest}". Mention that the request is being handled by the EarnYard Support Team.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      return "Your request has been logged. Our team will review it shortly.";
    }
  }
}

export class AdminAIService {
  async getAdminGuidance(query: string, appState: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are the "EarnYard Comptroller".
      
      App State Overview:
      - Users Count: ${appState.users?.length || 0}
      - Pending Approvals: ${appState.approvals?.filter((a: any) => a.status === 'pending').length || 0}
      - Active Tasks: ${appState.tasks?.length || 0}

      Admin Query: "${query}"

      Tasks:
      1. Provide high-level administrative guidance and financial insights.
      2. Analyze system load or pending items if mentioned.
      3. Maintain a secure, authoritative tone.
      
      Respond concisely using Markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Admin Error:", error);
      return "Neural link failed. Verify terminal permissions.";
    }
  }
}
